import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import crypto from "node:crypto";
import { importStallRows } from './stallImport.js';
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is required.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Copy server/.env.example to server/.env and fill in real values.");
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Safe defaults for Supabase's connection pooler: cap how many clients we
  // hold open, fail fast on a stuck connection attempt instead of hanging
  // the request forever, and bound how long any single query can run.
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 15_000,
  query_timeout: 15_000,
});

// ── Attachments (Supabase Storage) ──────────────────────────────────────────
// One private bucket holds every attachment, separated by prefix:
//   permits/<applicationId>/…  violations/<violationId>/…
//   checks/<checkRequestId>/…  receipts/<receiptId>/…
// The bucket has no RLS policies on purpose. This server connects with the
// service role and bypasses RLS, so nothing can be read with an anon key —
// files only ever leave here as short-lived signed URLs, and only for rows the
// caller was already allowed to receive.
const ATTACHMENTS_BUCKET = "attachments";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
const SIGNED_URL_TTL_SECONDS = 600;
const ALLOWED_ATTACHMENT_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf",
]);
// Marks rows recorded before real uploads existed: a file name with no file.
const VIRTUAL_PATH_PREFIX = "virtual://";

const supabaseStorage = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ── Account confirmation email (super-admin-created accounts) ──────────────
// Nothing is written to `profiles` when a super-admin submits the "Create
// User" form — a `pending_user_creations` row is created instead and this
// mailer sends the new person a confirmation link over Gmail SMTP. Without
// real Gmail credentials configured, the link is logged instead of emailed,
// so local dev works with no SMTP setup. Unlike a free-tier transactional
// email API (Resend, SendGrid, etc.), a real Gmail account can send to any
// recipient immediately — no domain verification required — which is why
// this app uses it instead, despite the one-time App Password setup cost.
const mailer = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

function apiPublicUrl() {
  return process.env.API_PUBLIC_URL || `http://localhost:${port}`;
}

function confirmUserSignupUrl(token) {
  return `${apiPublicUrl()}/api/auth/confirm-user?token=${token}`;
}

async function sendUserConfirmationEmail(email, token) {
  const url = confirmUserSignupUrl(token);
  if (!mailer) {
    console.log(`[pending user confirmation] ${email}: ${url}`);
    return;
  }
  await mailer.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Confirm your PubMark account",
    html: `<p>An administrator created a PubMark account for you.</p><p>Click the link below to confirm your email and activate the account:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours. If you weren't expecting this, you can ignore this email.</p>`,
  });
}

// ── Google Sign-In (ID token verification only — no client secret, no
// server-side authorization-code exchange) ─────────────────────────────────
class GoogleAuthError extends Error {
  constructor(message, status = 401, code = "google_token_invalid") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// Verifies a Google ID token's signature/issuer/audience/expiry against
// Google's own JWKS (handled internally by google-auth-library) and returns
// only the fields this app actually trusts from the payload. Called twice
// per signup (once at the login-check step, once again at fill-up-form
// submit) rather than threading server-side state between the two — an ID
// token is a self-contained, Google-signed JWT, so re-verifying is cheap
// and avoids needing a session/nonce store for a two-step flow.
async function verifyGoogleIdToken(idToken) {
  if (!googleClient) throw new GoogleAuthError("Google sign-in is not configured on this server.", 500, "google_not_configured");
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({ idToken: String(idToken || ""), audience: process.env.GOOGLE_CLIENT_ID });
  } catch {
    throw new GoogleAuthError("Google sign-in failed. Please try again.", 401, "google_token_invalid");
  }
  const payload = ticket.getPayload();
  if (!payload?.email) throw new GoogleAuthError("Google sign-in failed. Please try again.", 401, "google_token_invalid");
  if (!payload.email_verified) throw new GoogleAuthError("Your Google account's email isn't verified with Google.", 403, "google_email_unverified");
  return { email: String(payload.email).toLowerCase(), name: payload.name || "" };
}

class AttachmentError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function humanSize(bytes) { return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

// Storage keys must be predictable, so strip anything that isn't safe. Real
// data already contains names like "Screenshot_20260828_152723_Expo Go.jpg".
function sanitizeFileName(name) {
  const cleaned = String(name || "attachment")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return (cleaned || "attachment").slice(0, 120);
}

/**
 * Uploads one base64 attachment and returns its storage path.
 * Size is measured from the decoded bytes, never from a client-supplied
 * value, so a forged `size` field cannot get a large file through.
 */
async function uploadAttachment(prefix, ownerId, file) {
  // The uploader's own mistakes are reported first: telling someone their
  // file is too large is more useful than a server-configuration error they
  // cannot act on.
  const mimeType = String(file?.type || "").toLowerCase();
  if (!ALLOWED_ATTACHMENT_MIME.has(mimeType)) {
    throw new AttachmentError(`"${file?.name || "file"}" is not an accepted file type. Upload a JPEG, PNG, WebP, HEIC image or a PDF.`);
  }
  const buffer = Buffer.from(String(file?.base64 || ""), "base64");
  if (buffer.length === 0) throw new AttachmentError("The uploaded file is empty.");
  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentError(`"${file?.name || "file"}" is ${humanSize(buffer.length)}. The limit is ${humanSize(MAX_ATTACHMENT_BYTES)}.`);
  }
  if (!supabaseStorage) {
    throw new AttachmentError("File uploads are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.", 500);
  }
  const storagePath = `${prefix}/${ownerId}/${crypto.randomUUID()}-${sanitizeFileName(file?.name)}`;
  const { error } = await supabaseStorage.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
  if (error) throw new AttachmentError(`Upload failed: ${error.message}`, 502);
  return { storagePath, byteSize: buffer.length, mimeType };
}

// True when the client actually sent file contents to store.
function hasFileContents(file) {
  return Boolean(file && file.base64 && file.name && file.type);
}

async function signedUrlFor(storagePath) {
  if (!supabaseStorage || !storagePath) return null;
  if (String(storagePath).startsWith(VIRTUAL_PATH_PREFIX)) return null;
  const { data, error } = await supabaseStorage.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

async function removeAttachment(storagePath) {
  if (!supabaseStorage || !storagePath) return;
  if (String(storagePath).startsWith(VIRTUAL_PATH_PREFIX)) return;
  await supabaseStorage.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]).catch(() => {});
}

// Confirms a client-reported upload is real before the server ever trusts it
// as a database reference: the path must be under the folder this specific
// user was signed to upload into, and the object must actually exist there
// (a client could otherwise claim any path with no file behind it).
async function verifyUploadedObject(storagePath, expectedPrefix) {
  if (!supabaseStorage || !storagePath || !storagePath.startsWith(expectedPrefix)) return false;
  const lastSlash = storagePath.lastIndexOf("/");
  const folder = storagePath.slice(0, lastSlash);
  const fileName = storagePath.slice(lastSlash + 1);
  const { data } = await supabaseStorage.storage.from(ATTACHMENTS_BUCKET).list(folder, { search: fileName });
  return Array.isArray(data) && data.some((f) => f.name === fileName);
}

/**
 * Uploads a list of attachments for one owning record and returns the rows to
 * insert. If any file is rejected, everything already uploaded in this batch
 * is removed first, so a failed request leaves nothing orphaned in Storage.
 *
 * Every attachment must carry its contents. Accepting a name with no file
 * behind it is what left older records showing a document nobody could open,
 * so a client that fails to read a file is told, rather than silently
 * recording a placeholder.
 */
async function storeAttachments(prefix, ownerId, files, uploadedBy) {
  const list = (Array.isArray(files) ? files : []).filter(Boolean);
  const stored = [];
  try {
    for (const file of list) {
      if (!hasFileContents(file)) {
        throw new AttachmentError(
          `"${file?.name || "The attachment"}" could not be read, so it was not saved. Please attach it again.`
        );
      }
      const { storagePath, byteSize, mimeType } = await uploadAttachment(prefix, ownerId, file);
      stored.push({ storagePath, fileName: String(file.name), mimeType, fileSize: byteSize, uploadedBy });
    }
  } catch (error) {
    await Promise.all(stored.map((f) => removeAttachment(f.storagePath)));
    throw error;
  }
  return stored;
}

/**
 * Resolves attachments the client already uploaded directly to Storage via a
 * signed URL from POST /api/uploads/sign — verifies each one is real and
 * actually belongs to this user before the caller ever writes its path into
 * the database. If any entry fails verification, every entry already
 * confirmed in this same batch is removed, so a rejected upload doesn't leave
 * its siblings orphaned in Storage with no database row pointing at them.
 */
async function resolvePreSignedAttachments(prefix, userId, entries) {
  const list = (Array.isArray(entries) ? entries : []).filter(Boolean);
  const expectedPrefix = `${prefix}/${userId}/`;
  const resolved = [];
  try {
    for (const entry of list) {
      const storagePath = String(entry.path || "");
      const ok = await verifyUploadedObject(storagePath, expectedPrefix);
      if (!ok) {
        throw new AttachmentError(
          `"${entry.fileName || "The attachment"}" could not be verified. Please upload it again.`
        );
      }
      resolved.push({
        storagePath,
        fileName: String(entry.fileName || "attachment"),
        mimeType: String(entry.mimeType || "application/octet-stream"),
        fileSize: Number(entry.fileSize) || 0,
      });
    }
  } catch (error) {
    await Promise.all(resolved.map((f) => removeAttachment(f.storagePath)));
    throw error;
  }
  return resolved;
}
const configuredOrigins = (process.env.CLIENT_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);
function isLocalDevOrigin(origin) {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const url = new URL(origin);
    const port = Number(url.port || 80);
    const isVitePort = port >= 5170 && port < 5180; // web app (Vite)
    // Mobile app run in a browser. Expo starts at 8081 and walks upward if
    // that port is taken, so allow a small range rather than one exact port.
    const isExpoWebPort = (port >= 8081 && port < 8090) || port === 19006;
    const isLoopback = ["localhost", "127.0.0.1"].includes(url.hostname);
    const isLanIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    return (isVitePort || isExpoWebPort) && (isLoopback || isLanIp);
  }
  catch { return false; }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

function cookieOptions() { return { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }; }
// Sets the session cookie (used by the web app) and returns the same token so
// callers can also hand it to non-browser clients like the mobile app.
function setSession(res, profile) {
  const token = jwt.sign({ sub: profile.id, role: profile.role }, jwtSecret, { expiresIn: "8h" });
  res.cookie("pubmark_session", token, cookieOptions());
  return token;
}
// Accepts either an Authorization: Bearer token (mobile) or the session cookie
// (web). React Native does not persist cookies reliably, hence the header path.
//
// Also checks `is_archived` on every request (not just at login) — a vendor
// whose account gets terminated while they're still signed in is cut off on
// their very next action instead of staying logged in until their token's
// natural 8h expiry. `code: "account_terminated"` lets the client tell this
// apart from an ordinary expired/invalid session and force a clean logout.
async function requireAuth(req, res, next) {
  const bearerToken = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  const cookieToken = req.headers.cookie?.match(/(?:^|; )pubmark_session=([^;]+)/)?.[1];
  let auth;
  try { auth = jwt.verify(bearerToken || cookieToken || "", jwtSecret); }
  catch {
    res.clearCookie("pubmark_session", cookieOptions());
    return res.status(401).json({ message: "Sign in is required.", code: "session_invalid" });
  }
  try {
    const { rows } = await db.query("SELECT role, is_archived FROM profiles WHERE id = $1", [auth.sub]);
    if (!rows[0]) {
      res.clearCookie("pubmark_session", cookieOptions());
      return res.status(401).json({ message: "Sign in is required.", code: "session_invalid" });
    }
    if (rows[0].is_archived) {
      res.clearCookie("pubmark_session", cookieOptions());
      return res.status(401).json({ message: "This account has been terminated.", code: "account_terminated" });
    }
    auth.role = rows[0].role;
  } catch (error) { return next(error); }
  req.auth = auth;
  next();
}
function profile(row) { return { id: row.id, email: row.email, name: row.name, role: row.role, address: row.address, phone: row.phone, department: row.department, createdAt: row.created_at }; }
function requireRole(...roles) { return (req, res, next) => { if (!roles.includes(req.auth?.role)) return res.status(403).json({ message: "Access denied." }); next(); }; }
function parsePagination(req, maxLimit = 100) {
  if (req.query.limit === undefined) return { limit: null, offset: 0 };
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 1), maxLimit);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  return { limit, offset };
}

// For stable, frequently-repeated public reads (stalls/facilities/perimeters
// on map screens) — sends a strong ETag over the exact JSON body and answers
// with a bodyless 304 when the caller's cached copy is still current, so
// polling a screen that hasn't changed doesn't re-send the full payload.
function sendWithETag(req, res, payload) {
  const body = JSON.stringify(payload);
  const etag = `"${crypto.createHash("sha1").update(body).digest("hex")}"`;
  res.set("ETag", etag);
  if (req.headers["if-none-match"] === etag) return res.status(304).end();
  res.type("application/json").send(body);
}

function mapAnnouncementRow(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    category: row.category || null,
    createdAt: row.created_at,
    author: row.author_name || "Admin",
    authorId: row.author_id,
  };
}

function parsePermitMeta(remarks) {
  const source = remarks || "";
  const read = (pattern) => source.match(pattern)?.[1] || null;

  return {
    permitDeadlineAt: read(/\[\[PM_PERMIT_DEADLINE:([^\]]+)\]\]/),
    permitDeadlineUpdatedAt: read(/\[\[PM_PERMIT_DEADLINE_UPDATED:([^\]]+)\]\]/),
    permitTerminatedAt: read(/\[\[PM_PERMIT_TERMINATED:([^\]]+)\]\]/),
    visibleRemarks: source
      .replace(/\[\[PM_PERMIT_DEADLINE:[^\]]+\]\]\s*/g, "")
      .replace(/\[\[PM_PERMIT_DEADLINE_UPDATED:[^\]]+\]\]\s*/g, "")
      .replace(/\[\[PM_PERMIT_TERMINATED:[^\]]+\]\]\s*/g, "")
      .trim(),
  };
}

function buildPermitMetaRemarks(visibleRemarks, meta = {}) {
  const parts = [];
  if (meta.permitDeadlineAt) parts.push(`[[PM_PERMIT_DEADLINE:${meta.permitDeadlineAt}]]`);
  if (meta.permitDeadlineUpdatedAt) parts.push(`[[PM_PERMIT_DEADLINE_UPDATED:${meta.permitDeadlineUpdatedAt}]]`);
  if (meta.permitTerminatedAt) parts.push(`[[PM_PERMIT_TERMINATED:${meta.permitTerminatedAt}]]`);
  if ((visibleRemarks || "").trim()) parts.push(visibleRemarks.trim());
  return parts.join("\n");
}

function mapCompletionFileType(mimeType) {
  if ((mimeType || "").startsWith("image/")) return "image";
  if ((mimeType || "").startsWith("video/")) return "video";
  return "document";
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

async function getCheckRequestFilesMap(requestIds) {
  if (requestIds.length === 0) return new Map();
  const placeholders = requestIds.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await db.query(
    `SELECT id, check_request_id, storage_path, file_name, mime_type, file_size FROM check_request_files WHERE check_request_id IN (${placeholders}) ORDER BY created_at ASC`,
    requestIds
  );
  // Signed URLs are generated in parallel, not one at a time — this runs on
  // GET /api/check-requests, so a sequential await per file across every
  // request turned a page with several inspections into a slow wait.
  const entries = await Promise.all(rows.map(async (row) => ({
    checkRequestId: row.check_request_id,
    file: {
      // `id` lets a client hand an existing file back on update without
      // re-uploading it; `url` is null for rows recorded before real uploads.
      id: row.id,
      name: row.file_name,
      type: mapCompletionFileType(row.mime_type),
      size: formatBytes(row.file_size),
      url: await signedUrlFor(row.storage_path),
    },
  })));
  const filesMap = new Map();
  for (const { checkRequestId, file } of entries) {
    const existing = filesMap.get(checkRequestId) || [];
    existing.push(file);
    filesMap.set(checkRequestId, existing);
  }
  return filesMap;
}

function mapCheckRequestRow(row, filesMap = new Map()) {
  return {
    id: row.id,
    stallId: row.stall_id,
    stallName: row.stall_name,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    priority: row.priority,
    reason: row.reason,
    // Set only when this request was generated from a violation report's
    // "Send Req" — lets the UI show it as a followup instead of a generic
    // priority-based check request.
    category: row.category || null,
    notes: row.notes || "",
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    completionNotes: row.completion_notes || "",
    completionSummary: row.completion_summary || "",
    completionFiles: filesMap.get(row.id) || [],
  };
}

function mapViolationRequestRow(row) {
  return {
    id: row.id,
    stallId: row.stall_id,
    stallName: row.stall_name,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name,
    reason: row.reason,
    category: row.category || null,
    status: row.status,
    assignedOfficerId: row.assigned_officer_id,
    assignedOfficerName: row.assigned_officer_name,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function listCheckRequestsInternal(officerId = null, { includeArchived = false } = {}) {
  const params = [];
  const conditions = [];
  if (officerId) { params.push(officerId); conditions.push(`(cr.assigned_to = $${params.length} OR cr.assigned_to IS NULL)`); }
  if (!includeArchived) conditions.push("cr.is_archived = false");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await db.query(`
    SELECT
      cr.id, cr.stall_id, cr.requested_by, cr.assigned_to, cr.priority, cr.reason, cr.category, cr.notes,
      cr.status, cr.created_at, cr.completed_at, cr.completion_notes, cr.completion_summary,
      s.stall_name,
      rp.name AS requested_by_name,
      ap.name AS assigned_to_name
    FROM check_requests cr
    LEFT JOIN stalls s ON s.id = cr.stall_id
    LEFT JOIN profiles rp ON rp.id = cr.requested_by
    LEFT JOIN profiles ap ON ap.id = cr.assigned_to
    ${where}
    ORDER BY cr.created_at DESC
  `, params);
  const filesMap = await getCheckRequestFilesMap(rows.map((row) => row.id));
  return rows.map((row) => mapCheckRequestRow(row, filesMap));
}

async function listViolationRequestsInternal() {
  const { rows } = await db.query(`
    SELECT
      vr.id, vr.stall_id, vr.requested_by, vr.reason, vr.category, vr.status, vr.assigned_officer_id,
      vr.created_at, vr.completed_at,
      s.stall_name,
      rp.name AS requested_by_name,
      ap.name AS assigned_officer_name
    FROM violation_requests vr
    LEFT JOIN stalls s ON s.id = vr.stall_id
    LEFT JOIN profiles rp ON rp.id = vr.requested_by
    LEFT JOIN profiles ap ON ap.id = vr.assigned_officer_id
    ORDER BY vr.created_at DESC
  `);
  return rows.map(mapViolationRequestRow);
}

async function syncViolationRequestsToCheckRequests() {
  const { rows } = await db.query(`
    SELECT
      vr.id, vr.stall_id, vr.requested_by, vr.assigned_officer_id, vr.reason, vr.category, vr.status,
      vr.created_at, vr.completed_at
    FROM violation_requests vr
    LEFT JOIN check_requests cr ON cr.id = vr.id
    WHERE cr.id IS NULL
  `);

  for (const row of rows) {
    await db.query(
      "INSERT INTO check_requests (id, stall_id, requested_by, assigned_to, priority, reason, category, notes, status, created_at, completed_at, completion_notes, completion_summary) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)",
      [
        row.id,
        row.stall_id,
        row.requested_by,
        row.assigned_officer_id,
        "normal",
        row.reason,
        row.category,
        "Generated from violation request.",
        row.status === "completed" ? "completed" : "pending",
        row.created_at,
        row.status === "completed" ? row.completed_at || new Date() : null,
        "",
        "",
      ]
    );
  }
}

async function getViolationEvidenceMap(violationIds) {
  if (violationIds.length === 0) return new Map();
  const placeholders = violationIds.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await db.query(
    `SELECT id, violation_id, storage_path, file_name, mime_type, file_size FROM violation_evidence WHERE violation_id IN (${placeholders}) ORDER BY created_at ASC`,
    violationIds
  );
  // Signed URLs are generated in parallel — one per row awaited in sequence
  // turned a page with dozens of attachments into a multi-second response.
  const entries = await Promise.all(rows.map(async (row) => ({
    violationId: row.violation_id,
    file: {
      id: row.id,
      name: row.file_name,
      type: mapCompletionFileType(row.mime_type),
      size: formatBytes(row.file_size),
      url: await signedUrlFor(row.storage_path),
    },
  })));
  const evidenceMap = new Map();
  for (const { violationId, file } of entries) {
    const existing = evidenceMap.get(violationId) || [];
    existing.push(file);
    evidenceMap.set(violationId, existing);
  }
  return evidenceMap;
}

async function getStallImagesMap(stallIds) {
  if (stallIds.length === 0) return new Map();
  const placeholders = stallIds.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await db.query(
    `SELECT id, stall_id, storage_path, file_name, mime_type, file_size FROM stall_images WHERE stall_id IN (${placeholders}) ORDER BY created_at ASC`,
    stallIds
  );
  // Signed URLs are generated in parallel, not one at a time — this runs on
  // GET /api/stalls, the map's main list endpoint, so a sequential await per
  // photo across every stall turned page loads into a multi-second wait.
  const entries = await Promise.all(rows.map(async (row) => ({
    stallId: row.stall_id,
    image: {
      id: row.id,
      name: row.file_name,
      type: mapCompletionFileType(row.mime_type),
      size: formatBytes(row.file_size),
      url: await signedUrlFor(row.storage_path),
    },
  })));
  const imagesMap = new Map();
  for (const { stallId, image } of entries) {
    const existing = imagesMap.get(stallId) || [];
    existing.push(image);
    imagesMap.set(stallId, existing);
  }
  return imagesMap;
}

function mapViolationRow(row, evidenceMap = new Map()) {
  return {
    id: row.id,
    stallId: row.stall_id,
    stallName: row.stall_name,
    vendorName: row.vendor_name || "Unknown",
    officerId: row.officer_id,
    officerName: row.officer_name,
    category: row.category,
    description: row.description,
    status: row.status,
    evidence: evidenceMap.get(row.id) || [],
    remarks: row.remarks || "",
    vendorNotifiedAt: row.vendor_notified_at || null,
    vendorNoticeMessage: row.vendor_notice_message || "",
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

function mapTerminationRequestRow(row) {
  return {
    id: row.id,
    type: row.type,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorEmail: row.vendor_email,
    stallId: row.stall_id,
    stallName: row.stall_name,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    // Only populated for type "account" — the stall(s), if any, the vendor
    // still actively holds at the moment of the request, so an admin can see
    // this before approving (which will end all of them as a side effect).
    activeStalls: row.active_stalls ?? [],
  };
}

/**
 * @param {string|null} vendorId When set, restricts the result to that
 *   vendor's own violations. Evidence photos are only signed for rows that
 *   come back, so this filter is what keeps one vendor from opening another
 *   vendor's evidence.
 * @param {{includeArchived?: boolean}} [options] Staff views (vendorId null)
 *   exclude archived violations by default, so an admin archiving a closed-
 *   out violation makes it disappear from the working list; a vendor still
 *   sees their own full history regardless.
 */
async function listViolationsInternal(vendorId = null, { includeArchived = !!vendorId } = {}) {
  const params = [];
  const conditions = [];
  if (vendorId) { params.push(vendorId); conditions.push(`v.vendor_id = $${params.length}`); }
  if (!includeArchived) conditions.push("v.is_archived = false");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await db.query(`
    SELECT
      v.id, v.stall_id, v.vendor_id, v.officer_id, v.category, v.description, v.status, v.remarks,
      v.vendor_notified_at, v.vendor_notice_message, v.created_at, v.resolved_at,
      s.stall_name,
      vp.name AS vendor_name,
      op.name AS officer_name
    FROM violations v
    LEFT JOIN stalls s ON s.id = v.stall_id
    LEFT JOIN profiles vp ON vp.id = v.vendor_id
    LEFT JOIN profiles op ON op.id = v.officer_id
    ${where}
    ORDER BY v.created_at DESC
  `, params);
  const evidenceMap = await getViolationEvidenceMap(rows.map((row) => row.id));
  return rows.map((row) => mapViolationRow(row, evidenceMap));
}

async function listTerminationRequestsInternal() {
  const { rows } = await db.query(`
    SELECT
      tr.id, tr.type, tr.vendor_id, tr.stall_id, tr.reason, tr.status, tr.created_at, tr.resolved_at,
      vp.name AS vendor_name,
      vp.email AS vendor_email,
      s.stall_name,
      active.stalls AS active_stalls
    FROM termination_requests tr
    LEFT JOIN profiles vp ON vp.id = tr.vendor_id
    LEFT JOIN stalls s ON s.id = tr.stall_id
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('stallId', a.stall_id, 'stallName', st.stall_name, 'contractEnd', a.contract_end) ORDER BY a.contract_end) AS stalls
      FROM applications a
      JOIN stalls st ON st.id = a.stall_id
      WHERE a.user_id = tr.vendor_id AND a.status = 'approved'
    ) active ON tr.type = 'account'
    ORDER BY tr.created_at DESC
  `);
  return rows.map(mapTerminationRequestRow);
}

// Stored paths look like "permits/<id>/<uuid>-my-permit.jpg". Strip the folder
// and the uuid the server added so the vendor sees the name they uploaded.
function displayFileName(storagePath) {
  if (!storagePath) return null;
  const base = String(storagePath).split("/").pop() || "";
  return base.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "") || null;
}

// Keeps the stored stalls.status column truthful whenever an application's
// approval state changes, so a direct look at the stalls table (Supabase
// dashboard, a raw query, etc.) shows the same thing the app already
// computes live everywhere else (AdminMapView, Analytics, SuperAdminDashboard).
// "unavailable" is a real manual admin flag (maintenance/closure) and always
// wins — this never overwrites it, matching the same precedence the UI uses.
async function syncStallOccupancy(stallId, client = db) {
  if (!stallId) return;
  const { rows } = await client.query(
    "SELECT 1 FROM applications WHERE stall_id = $1 AND status = 'approved' LIMIT 1",
    [stallId]
  );
  await client.query(
    "UPDATE stalls SET status = $1 WHERE id = $2 AND status <> 'unavailable'",
    [rows.length > 0 ? "occupied" : "vacant", stallId]
  );
}

async function mapApplicationRow(r) {
  const permitMeta = parsePermitMeta(r.admin_remarks || "");

  return {
    id: r.id,
    userId: r.user_id,
    stallId: r.stall_id,
    stallName: r.stall_name,
    stallSection: r.section,
    floorArea: r.floor_area,
    applicantName: r.applicant_name || r.name,
    applicantEmail: r.applicant_email || r.email,
    applicantAddress: r.applicant_address || r.address,
    businessName: r.business_name,
    businessType: r.business_type,
    contractStart: r.contract_start,
    contractTermMonths: r.contract_term_months.toString(),
    contractEnd: r.contract_end,
    permitFileName: displayFileName(r.permit_path),
    permitFileSize: null,
    // Null when no file was actually stored, so the UI can show the name
    // without offering a link that cannot open.
    permitUrl: await signedUrlFor(r.permit_path),
    additionalFileName: displayFileName(r.additional_file_path),
    additionalFileSize: null,
    additionalFileUrl: await signedUrlFor(r.additional_file_path),
    notes: r.notes || "",
    status: r.status,
    adminRemarks: r.admin_remarks || "",
    dateApplied: r.date_applied,
    approvedAt: r.approved_at,
    rejectedAt: r.rejected_at,
    permitUploadedAt: r.permit_uploaded_at,
    permitDeadlineAt: permitMeta.permitDeadlineAt,
    permitDeadlineUpdatedAt: permitMeta.permitDeadlineUpdatedAt,
    permitTerminatedAt: permitMeta.permitTerminatedAt,
    renewalDeadlineAt: r.renewal_deadline_at,
    contractTerminatedAt: r.contract_terminated_at,
  };
}

async function autoTerminateExpiredContracts() {
  const { rows } = await db.query(`
    UPDATE applications
    SET status = 'rejected', contract_terminated_at = NOW()
    WHERE status = 'approved'
      AND contract_terminated_at IS NULL
      AND COALESCE(renewal_deadline_at, contract_end + INTERVAL '7 days') < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM contract_renewal_requests rr
        WHERE rr.application_id = applications.id AND rr.status = 'pending'
      )
    RETURNING stall_id
  `);
  for (const row of rows) await syncStallOccupancy(row.stall_id);
}

async function autoTerminateExpiredPermitDeadlines() {
  const { rows } = await db.query("SELECT id, stall_id, permit_path, status, admin_remarks FROM applications WHERE status = 'approved'");
  const now = Date.now();

  for (const row of rows) {
    const meta = parsePermitMeta(row.admin_remarks || "");
    if (!meta.permitDeadlineAt || row.permit_path || meta.permitTerminatedAt) continue;

    const deadlineMs = new Date(meta.permitDeadlineAt).getTime();
    if (Number.isNaN(deadlineMs) || deadlineMs > now) continue;

    const deadlineLabel = new Date(meta.permitDeadlineAt).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const terminationMessage = `Application terminated because the business permit was not submitted by ${deadlineLabel}.`;
    const nextVisibleRemarks = meta.visibleRemarks.includes("business permit was not submitted by")
      ? meta.visibleRemarks
      : [meta.visibleRemarks, terminationMessage].filter(Boolean).join("\n\n");

    await db.query(
      "UPDATE applications SET status = 'rejected', admin_remarks = $1 WHERE id = $2",
      [
        buildPermitMetaRemarks(nextVisibleRemarks, {
          permitDeadlineAt: meta.permitDeadlineAt,
          permitDeadlineUpdatedAt: meta.permitDeadlineUpdatedAt,
          permitTerminatedAt: new Date().toISOString(),
        }),
        row.id,
      ]
    );
    await syncStallOccupancy(row.stall_id);
  }
}

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase();
    const password = String(req.body.password || "");
    const { rows } = await db.query("SELECT * FROM profiles WHERE email = $1 LIMIT 1", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      // A super-admin-created account isn't in `profiles` yet if it's still
      // waiting on its confirmation email — give that a clearer message than
      // "invalid email or password". Only shown when the password actually
      // matches the pending invite, so a wrong-password guess still can't
      // reveal whether a pending invite exists for this email.
      if (!user) {
        const { rows: pendingRows } = await db.query(
          "SELECT password_hash FROM pending_user_creations WHERE email = $1 AND expires_at > now()",
          [email]
        );
        const pending = pendingRows[0];
        if (pending && (await bcrypt.compare(password, pending.password_hash))) {
          return res.status(403).json({
            message: "Please confirm your email before signing in.",
            code: "pending_confirmation",
          });
        }
      }
      return res.status(401).json({ message: "Invalid email or password." });
    }
    // Checked only after the password is confirmed correct, so a wrong
    // guess never reveals whether an account was terminated.
    if (user.is_archived) return res.status(403).json({ message: "This account has been terminated.", code: "account_terminated" });
    const result = profile(user); const token = setSession(res, result); res.json({ profile: result, token });
  } catch (error) { next(error); }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password || !phone || !address || String(password).length < 6) return res.status(400).json({ message: "Complete all fields and use a password with at least 6 characters." });
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await db.query("INSERT INTO profiles (id, email, password_hash, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6, 'vendor')", [id, String(email).toLowerCase(), passwordHash, name, phone, address]);
    const result = { id, email: String(email).toLowerCase(), name, phone, address, role: "vendor" }; const token = setSession(res, result); res.status(201).json({ profile: result, token });
  } catch (error) { if (error?.code === "23505") return res.status(409).json({ message: "This email is already in use." }); next(error); }
});

// Verified Google email matched against `profiles` first, then
// `pending_user_creations` — an existing confirmed account logs straight
// in (regardless of whether it was originally created via Google or a
// password), a pending one returns the exact same pending_confirmation
// shape the password-login route uses below, and a brand-new email tells
// the client to show the fill-up form instead of creating anything yet.
app.post("/api/auth/google/login", async (req, res, next) => {
  try {
    const { email, name } = await verifyGoogleIdToken(req.body.credential);
    const { rows } = await db.query("SELECT * FROM profiles WHERE email = $1 LIMIT 1", [email]);
    const user = rows[0];
    if (user) {
      if (user.is_archived) return res.status(403).json({ message: "This account has been terminated.", code: "account_terminated" });
      const result = profile(user);
      const token = setSession(res, result);
      return res.json({ profile: result, token });
    }
    const { rows: pendingRows } = await db.query(
      "SELECT 1 FROM pending_user_creations WHERE email = $1 AND expires_at > now() LIMIT 1",
      [email]
    );
    if (pendingRows[0]) return res.status(403).json({ message: "Please confirm your email before signing in.", code: "pending_confirmation" });
    return res.json({ needsSignup: true, email, name });
  } catch (error) {
    if (error instanceof GoogleAuthError) return res.status(error.status).json({ message: error.message, code: error.code });
    next(error);
  }
});

// Completes a Google-initiated signup — mirrors POST /api/users almost
// exactly (same pending_user_creations upsert + confirmation email), but
// public, role hardcoded to vendor, and created_by NULL since there's no
// authenticated admin behind a self-service signup. The email is never
// read from the request body — it's re-derived by re-verifying the same
// Google credential the client already used for the login check, so there
// is nothing here a client could spoof.
app.post("/api/auth/google/register", async (req, res, next) => {
  try {
    const { email } = await verifyGoogleIdToken(req.body.credential);
    const { name, phone, address, password } = req.body;
    if (!name || !phone || !address || !password || String(password).length < 6) {
      return res.status(400).json({ message: "Complete all fields and use a password with at least 6 characters." });
    }
    const { rows: existing } = await db.query("SELECT id FROM profiles WHERE email = $1", [email]);
    if (existing[0]) return res.status(409).json({ message: "This email is already in use." });

    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO pending_user_creations (email, name, password_hash, role, phone, address, department, created_by, token_hash, expires_at)
       VALUES ($1, $2, $3, 'vendor', $4, $5, NULL, NULL, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'vendor',
         phone = EXCLUDED.phone, address = EXCLUDED.address, department = NULL,
         created_by = NULL, token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at, created_at = now()`,
      [email, name, passwordHash, phone, address, tokenHash, expiresAt]
    );
    try {
      await sendUserConfirmationEmail(email, rawToken);
    } catch (sendError) {
      await db.query("DELETE FROM pending_user_creations WHERE email = $1", [email]).catch(() => {});
      return res.status(502).json({ message: `The confirmation email could not be sent: ${sendError.message}` });
    }
    res.json({ pendingConfirmation: true, email });
  } catch (error) {
    if (error instanceof GoogleAuthError) return res.status(error.status).json({ message: error.message, code: error.code });
    if (error?.code === "23505") return res.status(409).json({ message: "This email is already in use." });
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try { const { rows } = await db.query("SELECT id, email, name, role, address, phone, department FROM profiles WHERE id = $1", [req.auth.sub]); if (!rows[0]) return res.status(401).json({ message: "Account not found." }); res.json({ profile: profile(rows[0]) }); } catch (error) { next(error); }
});

// Login-page totals. This intentionally exposes aggregate counts only; user
// records and other account details remain behind the protected /api/users
// endpoint.
app.get("/api/public-stats", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM profiles WHERE is_archived = false) AS user_count,
         (SELECT COUNT(*)::int FROM stalls) AS stall_count`
    );
    res.json({
      userCount: Number(rows[0].user_count),
      stallCount: Number(rows[0].stall_count),
    });
  } catch (error) { next(error); }
});

// Per-account "last seen" watermarks for notification badges (mobile
// Notices tab, and any future badge type — keyed generically by
// `tracker_key` rather than one column per notification type). Any
// authenticated role reads/writes only its own row, scoped by req.auth.sub.
app.get("/api/notification-read-state", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT tracker_key, last_seen_at FROM notification_read_state WHERE user_id = $1",
      [req.auth.sub]
    );
    const state = {};
    for (const row of rows) state[row.tracker_key] = row.last_seen_at;
    res.json({ state });
  } catch (error) { next(error); }
});

app.post("/api/notification-read-state/:trackerKey", requireAuth, async (req, res, next) => {
  try {
    const trackerKey = String(req.params.trackerKey || "").trim();
    if (!trackerKey) return res.status(400).json({ message: "A tracker key is required." });
    const { rows } = await db.query(
      `INSERT INTO notification_read_state (user_id, tracker_key, last_seen_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id, tracker_key) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at
       RETURNING last_seen_at`,
      [req.auth.sub, trackerKey]
    );
    res.json({ trackerKey, lastSeenAt: rows[0].last_seen_at });
  } catch (error) { next(error); }
});
app.get("/api/auth/users/by-email", requireAuth, async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required." });
    const { rows } = await db.query(
      "SELECT id, email, name, role, address, phone, department FROM profiles WHERE email = $1 LIMIT 1",
      [email]
    );
    if (!rows[0]) return res.status(404).json({ message: "No PubMark account found with this email." });
    res.json({ profile: profile(rows[0]) });
  } catch (error) { next(error); }
});
app.post("/api/auth/logout", (_req, res) => { res.clearCookie("pubmark_session", cookieOptions()); res.json({ ok: true }); });

// Plain link opened from the confirmation email, not called by either app —
// returns a small HTML page rather than JSON.
function confirmationPage(title, message) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1.5rem;color:#1f2937}h1{font-size:1.25rem;color:#0f766e}</style>
  </head><body><h1>${title}</h1><p>${message}</p></body></html>`;
}
app.get("/api/auth/confirm-user", async (req, res, next) => {
  try {
    const token = String(req.query.token || "");
    const tokenHash = token ? crypto.createHash("sha256").update(token).digest("hex") : "";
    const { rows } = await db.query(
      "SELECT * FROM pending_user_creations WHERE token_hash = $1 AND expires_at > now()",
      [tokenHash]
    );
    const pending = rows[0];
    if (!pending) {
      return res.status(400).send(confirmationPage("Link expired or invalid", "This confirmation link is no longer valid. Ask the person who created your account to resend the invitation."));
    }
    try {
      await db.query(
        "INSERT INTO profiles (id, email, password_hash, name, phone, address, role, department) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [crypto.randomUUID(), pending.email, pending.password_hash, pending.name, pending.phone || "", pending.address || "", pending.role, pending.department || null]
      );
    } catch (error) {
      if (error?.code !== "23505") throw error;
    }
    await db.query("DELETE FROM pending_user_creations WHERE id = $1", [pending.id]);
    res.send(confirmationPage("Account confirmed", "Your PubMark account is now active. You can close this tab and sign in."));
  } catch (error) { next(error); }
});

const USER_SORT_COLUMNS = { name: "name", email: "email", role: "role", phone: "phone", createdAt: "created_at" };

app.get("/api/users", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const role = String(req.query.role || "").trim();
    const search = String(req.query.search || "").trim();
    const values = [];
    const conditions = [];
    if (role) { values.push(role); conditions.push(`role = $${values.length}`); }
    if (search) { values.push(`%${search}%`); conditions.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length})`); }
    if (String(req.query.activeOnly) === "true") conditions.push("is_archived = false");
    const whereSql = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";

    const sortColumn = USER_SORT_COLUMNS[String(req.query.sortField || "")] || "name";
    const sortDir = String(req.query.sortDir || "").toLowerCase() === "desc" ? "DESC" : "ASC";

    let sql = `SELECT id, email, name, role, address, phone, department, created_at FROM profiles${whereSql} ORDER BY ${sortColumn} ${sortDir}`;
    let total;
    const { limit, offset } = parsePagination(req);
    if (limit != null) {
      total = Number((await db.query(`SELECT COUNT(*) FROM profiles${whereSql}`, values)).rows[0].count);
      values.push(limit); sql += ` LIMIT $${values.length}`;
      values.push(offset); sql += ` OFFSET $${values.length}`;
    }
    const { rows } = await db.query(sql, values);
    res.json({ users: rows.map(profile), ...(total !== undefined ? { total } : {}) });
  } catch (error) { next(error); }
});

const VALID_USER_ROLES = ["super_admin", "admin", "vendor", "officer"];
function canAssignRole(req, role) {
  return !(role === "super_admin" || role === "admin") || req.auth.role === "super_admin";
}

// Creates a *pending* invitation rather than the account itself — nothing is
// written to `profiles` here. The account only comes into existence once the
// invited person clicks the confirmation link (GET /api/auth/confirm-user).
app.post("/api/users", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, department } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: "Name, email, password, and role are required." });
    if (!VALID_USER_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role." });
    if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    if (!canAssignRole(req, role)) return res.status(403).json({ message: "Only a super admin can create admin or super admin accounts." });

    const normalizedEmail = String(email).toLowerCase();
    const { rows: existing } = await db.query("SELECT id FROM profiles WHERE email = $1", [normalizedEmail]);
    if (existing[0]) return res.status(409).json({ message: "This email is already in use." });

    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO pending_user_creations (email, name, password_hash, role, phone, address, department, created_by, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role,
         phone = EXCLUDED.phone, address = EXCLUDED.address, department = EXCLUDED.department,
         created_by = EXCLUDED.created_by, token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at,
         created_at = now()`,
      [normalizedEmail, name, passwordHash, role, phone || "", address || "", department || null, req.auth.sub, tokenHash, expiresAt]
    );
    try {
      await sendUserConfirmationEmail(normalizedEmail, rawToken);
    } catch (sendError) {
      // Don't leave an unconfirmable invite behind if the email never went
      // out — the admin gets a clear reason instead of a generic 500, and
      // can fix the underlying issue (e.g. wrong recipient in Resend
      // sandbox mode) and just resubmit the form.
      await db.query("DELETE FROM pending_user_creations WHERE email = $1", [normalizedEmail]).catch(() => {});
      return res.status(502).json({ message: `The confirmation email could not be sent: ${sendError.message}` });
    }
    res.json({ pendingConfirmation: true, email: normalizedEmail });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ message: "This email is already in use." });
    next(error);
  }
});

app.patch("/api/users/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { name, phone, address, role, department, password } = req.body;
    if (role !== undefined && !VALID_USER_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role." });
    if (role !== undefined && !canAssignRole(req, role)) return res.status(403).json({ message: "Only a super admin can assign admin or super admin roles." });
    if (password && String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

    const updates = []; const values = [];
    if (name !== undefined) { values.push(name); updates.push(`name = $${values.length}`); }
    if (phone !== undefined) { values.push(phone); updates.push(`phone = $${values.length}`); }
    if (address !== undefined) { values.push(address); updates.push(`address = $${values.length}`); }
    if (role !== undefined) { values.push(role); updates.push(`role = $${values.length}`); }
    if (department !== undefined) { values.push(department || null); updates.push(`department = $${values.length}`); }
    if (password) { values.push(await bcrypt.hash(password, 12)); updates.push(`password_hash = $${values.length}`); }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });

    values.push(req.params.id);
    await db.query(`UPDATE profiles SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
    const { rows } = await db.query("SELECT id, email, name, role, address, phone, department, created_at FROM profiles WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "User not found." });
    res.json({ user: profile(rows[0]) });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ message: "This email is already in use." });
    next(error);
  }
});

app.delete("/api/users/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    if (req.auth.sub === req.params.id) return res.status(400).json({ message: "You cannot delete your own account." });
    await db.query("DELETE FROM profiles WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    if (error?.code === "23503") return res.status(409).json({ message: "Cannot delete this user: they have existing applications, violations, or other records linked to their account." });
    next(error);
  }
});

// Accounts invited via "Create User" that haven't clicked their confirmation
// link yet — makes an in-flight invite visible instead of silently
// disappearing after the super-admin submits the form.
app.get("/api/pending-users", requireAuth, requireRole("super_admin"), async (_req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT pu.id, pu.email, pu.name, pu.role, pu.phone, pu.created_at, pu.expires_at, p.name AS created_by_name
      FROM pending_user_creations pu
      LEFT JOIN profiles p ON p.id = pu.created_by
      ORDER BY pu.created_at DESC
    `);
    res.json({ pendingUsers: rows });
  } catch (error) { next(error); }
});

app.post("/api/pending-users/:id/resend", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { rows } = await db.query(
      "UPDATE pending_user_creations SET token_hash = $1, expires_at = $2 WHERE id = $3 RETURNING email",
      [tokenHash, expiresAt, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Pending invitation not found." });
    try {
      await sendUserConfirmationEmail(rows[0].email, rawToken);
    } catch (sendError) {
      return res.status(502).json({ message: `The confirmation email could not be sent: ${sendError.message}` });
    }
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.delete("/api/pending-users/:id", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    await db.query("DELETE FROM pending_user_creations WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/announcements", requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT a.id, a.title, a.message, a.type, a.category, a.author_id, a.created_at, p.name AS author_name
      FROM announcements a
      LEFT JOIN profiles p ON p.id = a.author_id
      ORDER BY a.created_at DESC
    `);
    res.json({ announcements: rows.map(mapAnnouncementRow) });
  } catch (error) { next(error); }
});

// Role-aware feed used by the web and mobile Notices screens. Broadcast
// announcements remain visible to every authenticated role. Private violation
// and inspection-request notices are added only for their captured vendor;
// internal report/request details never enter this response.
app.get("/api/notices", requireAuth, async (req, res, next) => {
  try {
    const { rows: announcementRows } = await db.query(`
      SELECT a.id, a.title, a.message, a.type, a.category, a.author_id, a.created_at, p.name AS author_name
      FROM announcements a
      LEFT JOIN profiles p ON p.id = a.author_id
    `);
    const notices = announcementRows.map((row) => ({
      ...mapAnnouncementRow(row),
      id: `announcement:${row.id}`,
      source: "announcement",
    }));

    if (req.auth.role === "vendor") {
      const { rows: violationRows } = await db.query(
        `SELECT v.id, v.category, v.vendor_notice_message, v.vendor_notified_at,
                v.officer_id, p.name AS officer_name
         FROM violations v
         LEFT JOIN profiles p ON p.id = v.officer_id
         WHERE v.vendor_id = $1
           AND v.vendor_notified_at IS NOT NULL`,
        [req.auth.sub]
      );
      for (const row of violationRows) {
        notices.push({
          id: `violation:${row.id}`,
          source: "violation",
          title: row.category,
          message: row.vendor_notice_message || "",
          type: "warning",
          category: row.category,
          createdAt: row.vendor_notified_at,
          author: row.officer_name || "Officer",
          authorId: row.officer_id,
        });
      }

      const { rows: checkRequestRows } = await db.query(
        `SELECT cr.id, cr.vendor_notice_message, cr.vendor_notified_at,
                cr.requested_by, p.name AS requested_by_name
         FROM check_requests cr
         LEFT JOIN profiles p ON p.id = cr.requested_by
         WHERE cr.vendor_notified_vendor_id = $1
           AND cr.vendor_notified_at IS NOT NULL`,
        [req.auth.sub]
      );
      for (const row of checkRequestRows) {
        notices.push({
          id: `check-request:${row.id}`,
          source: "check_request",
          title: "Officer inspection requested",
          message: row.vendor_notice_message || "",
          type: "info",
          category: "Inspection Request",
          createdAt: row.vendor_notified_at,
          author: row.requested_by_name || "Market administration",
          authorId: row.requested_by,
        });
      }
    }

    notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ notices });
  } catch (error) { next(error); }
});

app.post("/api/announcements", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const message = String(req.body.message || "").trim();
    const type = String(req.body.type || "info");
    // Free text, not an enum — "Other" in the admin picker lets a category
    // be typed that isn't in the preset list, so nothing forces a mismatch.
    const category = req.body.category ? String(req.body.category).trim() : null;
    if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
    if (!["info", "warning", "urgent", "success"].includes(type)) return res.status(400).json({ message: "Invalid announcement type." });

    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO announcements (id, title, message, type, category, author_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, title, message, type, category, req.auth.sub]
    );
    const { rows } = await db.query(
      `SELECT a.id, a.title, a.message, a.type, a.category, a.author_id, a.created_at, p.name AS author_name
       FROM announcements a
       LEFT JOIN profiles p ON p.id = a.author_id
       WHERE a.id = $1
       LIMIT 1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Announcement not found after creation." });
    res.status(201).json({ announcement: mapAnnouncementRow(rows[0]) });
  } catch (error) { next(error); }
});

app.delete("/api/announcements/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    await db.query("DELETE FROM announcements WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/check-requests", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
    await syncViolationRequestsToCheckRequests();
    const officerId = req.auth.role === "officer" ? req.auth.sub : null;
    const includeArchived = req.query.includeArchived === "true";
    const { limit, offset } = parsePagination(req);
    if (limit == null) {
      return res.json({ requests: await listCheckRequestsInternal(officerId, { includeArchived }) });
    }
    const values = [];
    const conditions = [];
    if (officerId) { values.push(officerId); conditions.push(`(cr.assigned_to = $${values.length} OR cr.assigned_to IS NULL)`); }
    if (!includeArchived) conditions.push("cr.is_archived = false");
    const whereSql = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const total = Number((await db.query(`SELECT COUNT(*) FROM check_requests cr${whereSql}`, values)).rows[0].count);
    values.push(limit); const limitParam = values.length;
    values.push(offset); const offsetParam = values.length;
    const { rows } = await db.query(`
      SELECT
        cr.id, cr.stall_id, cr.requested_by, cr.assigned_to, cr.priority, cr.reason, cr.category, cr.notes,
        cr.status, cr.created_at, cr.completed_at, cr.completion_notes, cr.completion_summary,
        s.stall_name, rp.name AS requested_by_name, ap.name AS assigned_to_name
      FROM check_requests cr
      LEFT JOIN stalls s ON s.id = cr.stall_id
      LEFT JOIN profiles rp ON rp.id = cr.requested_by
      LEFT JOIN profiles ap ON ap.id = cr.assigned_to
      ${whereSql}
      ORDER BY cr.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `, values);
    const filesMap = await getCheckRequestFilesMap(rows.map((row) => row.id));
    res.json({ requests: rows.map((row) => mapCheckRequestRow(row, filesMap)), total });
  } catch (error) { next(error); }
});

async function findActiveVendorForStall(stallId) {
  const { rows } = await db.query(
    `SELECT a.user_id
     FROM applications a
     JOIN profiles p ON p.id = a.user_id
     WHERE a.stall_id = $1
       AND a.status = 'approved'
       AND p.is_archived = false
     ORDER BY a.date_applied DESC
     LIMIT 1`,
    [stallId]
  );
  return rows[0]?.user_id ?? null;
}

app.post("/api/check-requests", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const stallId = String(req.body.stallId || "").trim();
    const assignedTo = req.body.assignedTo ? String(req.body.assignedTo).trim() : null;
    const priority = String(req.body.priority || "normal");
    const reason = String(req.body.reason || "").trim();
    const notes = String(req.body.notes || "").trim();
    const requestedBy = req.body.requestedBy ? String(req.body.requestedBy).trim() : req.auth.sub;
    const status = String(req.body.status || "pending");
    const completionNotes = String(req.body.completionNotes || "");
    const completionSummary = String(req.body.completionSummary || "");
    const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : new Date();
    const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : (status === "pending" ? null : new Date());
    if (req.body.notifyVendor !== undefined && typeof req.body.notifyVendor !== "boolean") {
      return res.status(400).json({ message: "Notify vendor must be selected." });
    }
    const notifyVendor = req.body.notifyVendor === true;
    const vendorNoticeMessage = notifyVendor
      ? String(req.body.vendorNoticeMessage || "").trim() || null
      : null;
    if (!stallId || !reason) return res.status(400).json({ message: "Stall and reason are required." });
    if (!["low", "normal", "high", "urgent"].includes(priority)) return res.status(400).json({ message: "Invalid priority." });
    if (!["pending", "completed", "cancelled"].includes(status)) return res.status(400).json({ message: "Invalid status." });
    const notifiedVendorId = notifyVendor ? await findActiveVendorForStall(stallId) : null;
    if (notifyVendor && !notifiedVendorId) {
      return res.status(409).json({ message: "This stall has no active vendor to notify. Choose the X option to send the request without a vendor notice." });
    }

    const id = crypto.randomUUID();
    const storedFiles = await storeAttachments("checks", id, req.body.completionFiles, req.auth.sub);

    const conn = await db.connect();
    try {
      await conn.query("BEGIN");
      await conn.query(
        `INSERT INTO check_requests
          (id, stall_id, requested_by, assigned_to, priority, reason, notes, status,
           vendor_notified_vendor_id, vendor_notified_at, vendor_notice_message,
           created_at, completed_at, completion_notes, completion_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          id, stallId, requestedBy, assignedTo, priority, reason, notes || null, status,
          notifiedVendorId, notifyVendor ? new Date() : null, vendorNoticeMessage,
          createdAt, completedAt, completionNotes, completionSummary,
        ]
      );
      for (const file of storedFiles) {
        await conn.query(
          "INSERT INTO check_request_files (id, check_request_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [crypto.randomUUID(), id, file.storagePath, file.fileName, file.mimeType, file.fileSize, req.auth.sub]
        );
      }
      await conn.query("COMMIT");
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
    res.status(201).json({ request: (await listCheckRequestsInternal(null, { includeArchived: true })).find((item) => item.id === id) });
  } catch (error) { next(error); }
});

app.patch("/api/check-requests/:id", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
    if (req.auth.role === "officer") {
      const { rows } = await db.query(
        "SELECT assigned_to FROM check_requests WHERE id = $1",
        [req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ message: "Check request not found." });
      if (rows[0].assigned_to && rows[0].assigned_to !== req.auth.sub) {
        return res.status(403).json({ message: "This check request is assigned to another officer." });
      }
    }

    const updates = [];
    const values = [];
    if (req.body.assignedTo !== undefined) { values.push(req.body.assignedTo ? String(req.body.assignedTo).trim() : null); updates.push(`assigned_to = $${values.length}`); }
    if (req.body.priority !== undefined) { values.push(String(req.body.priority)); updates.push(`priority = $${values.length}`); }
    if (req.body.reason !== undefined) { values.push(String(req.body.reason).trim()); updates.push(`reason = $${values.length}`); }
    if (req.body.notes !== undefined) { values.push(String(req.body.notes || "").trim() || null); updates.push(`notes = $${values.length}`); }
    if (req.body.status !== undefined) {
      values.push(String(req.body.status));
      updates.push(`status = $${values.length}`);
      values.push(req.body.status === "pending" ? null : new Date());
      updates.push(`completed_at = $${values.length}`);
    }
    if (req.body.completionNotes !== undefined) { values.push(String(req.body.completionNotes || "")); updates.push(`completion_notes = $${values.length}`); }
    if (req.body.completionSummary !== undefined) { values.push(String(req.body.completionSummary || "")); updates.push(`completion_summary = $${values.length}`); }

    // Uploaded to Storage before the transaction opens — a rejected/failed
    // upload should never hold a DB connection open waiting on it.
    let currentFiles = [];
    let keptIds = new Set();
    let storedFiles = [];
    if (Array.isArray(req.body.completionFiles)) {
      // A client editing an inspection sends back the files it already had
      // (identified by id, with no contents) plus any new ones. Keep the
      // former untouched — re-inserting them would throw away the real
      // uploads — and delete only what was actually removed.
      const { rows } = await db.query(
        "SELECT id, storage_path FROM check_request_files WHERE check_request_id = $1",
        [req.params.id]
      );
      currentFiles = rows;
      keptIds = new Set(
        req.body.completionFiles.map((file) => file?.id).filter(Boolean).map(String)
      );
      const incoming = req.body.completionFiles.filter((file) => !file?.id);
      storedFiles = await storeAttachments("checks", req.params.id, incoming, req.auth.sub);
    }

    const conn = await db.connect();
    let removedPaths = [];
    try {
      await conn.query("BEGIN");
      if (updates.length > 0) {
        values.push(req.params.id);
        await conn.query(`UPDATE check_requests SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
      }

      // A check request generated from a violation's "Send Req" shares its id
      // with the violation_requests row that spawned it. Completing it here
      // means the followup was done, so resolve the violation it was about
      // instead of leaving it stuck on "Reviewing" forever.
      if (req.body.status === "completed") {
        const completedAt = new Date();
        const { rows: linked } = await conn.query(
          "SELECT violation_id FROM violation_requests WHERE id = $1",
          [req.params.id]
        );
        if (linked[0]) {
          await conn.query(
            "UPDATE violation_requests SET status = 'completed', completed_at = $1 WHERE id = $2",
            [completedAt, req.params.id]
          );
        }
        if (linked[0]?.violation_id) {
          await conn.query(
            "UPDATE violations SET status = 'resolved', resolved_at = $1 WHERE id = $2 AND status <> 'resolved'",
            [completedAt, linked[0].violation_id]
          );
        }
      }

      const toRemove = currentFiles.filter((row) => !keptIds.has(String(row.id)));
      for (const row of toRemove) {
        await conn.query("DELETE FROM check_request_files WHERE id = $1", [row.id]);
      }
      for (const file of storedFiles) {
        await conn.query(
          "INSERT INTO check_request_files (id, check_request_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [crypto.randomUUID(), req.params.id, file.storagePath, file.fileName, file.mimeType, file.fileSize, req.auth.sub]
        );
      }
      await conn.query("COMMIT");
      removedPaths = toRemove.map((row) => row.storage_path);
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
    await Promise.all(removedPaths.map(removeAttachment));

    const updated = (await listCheckRequestsInternal(null, { includeArchived: true })).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Check request not found." });
    res.json({ request: updated });
  } catch (error) { next(error); }
});

app.delete("/api/check-requests/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT storage_path FROM check_request_files WHERE check_request_id = $1",
      [req.params.id]
    );
    await db.query("DELETE FROM check_requests WHERE id = $1", [req.params.id]);
    await Promise.all(rows.map((r) => removeAttachment(r.storage_path)));
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/violation-requests", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
    await syncViolationRequestsToCheckRequests();
    const { limit, offset } = parsePagination(req);
    if (limit == null) {
      return res.json({ requests: await listViolationRequestsInternal() });
    }
    const total = Number((await db.query("SELECT COUNT(*) FROM violation_requests")).rows[0].count);
    const { rows } = await db.query(`
      SELECT
        vr.id, vr.stall_id, vr.requested_by, vr.reason, vr.category, vr.status, vr.assigned_officer_id,
        vr.created_at, vr.completed_at,
        s.stall_name, rp.name AS requested_by_name, ap.name AS assigned_officer_name
      FROM violation_requests vr
      LEFT JOIN stalls s ON s.id = vr.stall_id
      LEFT JOIN profiles rp ON rp.id = vr.requested_by
      LEFT JOIN profiles ap ON ap.id = vr.assigned_officer_id
      ORDER BY vr.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    res.json({ requests: rows.map(mapViolationRequestRow), total });
  } catch (error) { next(error); }
});

app.post("/api/violation-requests", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const stallId = String(req.body.stallId || "").trim();
    const reason = String(req.body.reason || "").trim();
    // Set only when this request was sent from a violation report's
    // "Send Req" — lets the check-request UI show it as a followup on that
    // violation's category instead of a generic priority-based request.
    const category = req.body.category ? String(req.body.category).trim() : null;
    // Links this request back to the violation it followed up on, so
    // completing the resulting check request can resolve that violation
    // automatically instead of leaving it stuck on "Reviewing".
    const violationId = req.body.violationId ? String(req.body.violationId).trim() : null;
    const requestedBy = req.body.requestedBy ? String(req.body.requestedBy).trim() : req.auth.sub;
    const assignedOfficerId = req.body.assignedOfficerId ? String(req.body.assignedOfficerId).trim() : null;
    const status = String(req.body.status || (assignedOfficerId ? "assigned" : "pending"));
    const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : new Date();
    const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : (status === "completed" ? new Date() : null);
    if (req.body.notifyVendor !== undefined && typeof req.body.notifyVendor !== "boolean") {
      return res.status(400).json({ message: "Notify vendor must be selected." });
    }
    const notifyVendor = req.body.notifyVendor === true;
    const vendorNoticeMessage = notifyVendor
      ? String(req.body.vendorNoticeMessage || "").trim() || null
      : null;
    if (!stallId || !reason) return res.status(400).json({ message: "Stall and reason are required." });
    if (!["pending", "assigned", "completed"].includes(status)) return res.status(400).json({ message: "Invalid status." });
    const notifiedVendorId = notifyVendor ? await findActiveVendorForStall(stallId) : null;
    if (notifyVendor && !notifiedVendorId) {
      return res.status(409).json({ message: "This stall has no active vendor to notify. Choose the X option to send the request without a vendor notice." });
    }

    const id = crypto.randomUUID();
    const conn = await db.connect();
    try {
      await conn.query("BEGIN");
      await conn.query(
        "INSERT INTO violation_requests (id, stall_id, requested_by, reason, category, violation_id, status, assigned_officer_id, created_at, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [id, stallId, requestedBy, reason, category, violationId, status, assignedOfficerId, createdAt, completedAt]
      );
      await conn.query(
        `INSERT INTO check_requests
          (id, stall_id, requested_by, assigned_to, priority, reason, category, notes, status,
           vendor_notified_vendor_id, vendor_notified_at, vendor_notice_message,
           created_at, completed_at, completion_notes, completion_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id,
          stallId,
          requestedBy,
          assignedOfficerId,
          "normal",
          reason,
          category,
          "Generated from violation request.",
          status === "completed" ? "completed" : "pending",
          notifiedVendorId,
          notifyVendor ? new Date() : null,
          vendorNoticeMessage,
          createdAt,
          status === "completed" ? completedAt || new Date() : null,
          "",
          "",
        ]
      );
      await conn.query("COMMIT");
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
    res.status(201).json({ request: (await listViolationRequestsInternal()).find((item) => item.id === id) });
  } catch (error) { next(error); }
});

app.patch("/api/violation-requests/:id", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
    const updates = [];
    const values = [];
    if (req.body.reason !== undefined) { values.push(String(req.body.reason || "").trim()); updates.push(`reason = $${values.length}`); }
    if (req.body.assignedOfficerId !== undefined) {
      values.push(req.body.assignedOfficerId ? String(req.body.assignedOfficerId).trim() : null);
      updates.push(`assigned_officer_id = $${values.length}`);
      if (req.body.status === undefined) {
        values.push(req.body.assignedOfficerId ? "assigned" : "pending");
        updates.push(`status = $${values.length}`);
      }
    }
    if (req.body.status !== undefined) {
      values.push(String(req.body.status));
      updates.push(`status = $${values.length}`);
      values.push(req.body.status === "completed" ? new Date() : null);
      updates.push(`completed_at = $${values.length}`);
    }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });

    const mirroredUpdates = [];
    const mirroredValues = [];
    if (req.body.reason !== undefined) {
      mirroredValues.push(String(req.body.reason || "").trim());
      mirroredUpdates.push(`reason = $${mirroredValues.length}`);
    }
    if (req.body.assignedOfficerId !== undefined) {
      mirroredValues.push(req.body.assignedOfficerId ? String(req.body.assignedOfficerId).trim() : null);
      mirroredUpdates.push(`assigned_to = $${mirroredValues.length}`);
    }
    if (req.body.status !== undefined) {
      mirroredValues.push(req.body.status === "completed" ? "completed" : "pending");
      mirroredUpdates.push(`status = $${mirroredValues.length}`);
      mirroredValues.push(req.body.status === "completed" ? new Date() : null);
      mirroredUpdates.push(`completed_at = $${mirroredValues.length}`);
    } else if (req.body.assignedOfficerId !== undefined) {
      mirroredValues.push(req.body.assignedOfficerId ? "pending" : "pending");
      mirroredUpdates.push(`status = $${mirroredValues.length}`);
    }

    const conn = await db.connect();
    try {
      await conn.query("BEGIN");
      values.push(req.params.id);
      await conn.query(`UPDATE violation_requests SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
      if (mirroredUpdates.length > 0) {
        mirroredValues.push(req.params.id);
        await conn.query(`UPDATE check_requests SET ${mirroredUpdates.join(", ")} WHERE id = $${mirroredValues.length}`, mirroredValues);
      }
      await conn.query("COMMIT");
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
    const updated = (await listViolationRequestsInternal()).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Violation request not found." });
    res.json({ request: updated });
  } catch (error) { next(error); }
});

app.get("/api/violations", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
    // Staff working lists (Reports & Requests) want archived violations
    // hidden by default; a true historical count (e.g. Analytics) needs to
    // opt back in explicitly, since archiving never deletes the row.
    const includeArchived = req.query.includeArchived === "true";
    const { limit, offset } = parsePagination(req);
    if (limit == null) {
      return res.json({ violations: await listViolationsInternal(null, { includeArchived }) });
    }
    // Paginated path queries directly instead of the shared "fetch every
    // row" internal helper (still used, unpaginated, by mutation responses
    // that need to return one just-changed row).
    const values = [];
    const conditions = [];
    if (!includeArchived) conditions.push("v.is_archived = false");
    const whereSql = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const total = Number((await db.query(`SELECT COUNT(*) FROM violations v${whereSql}`, values)).rows[0].count);
    values.push(limit); const limitParam = values.length;
    values.push(offset); const offsetParam = values.length;
    const { rows } = await db.query(`
      SELECT
        v.id, v.stall_id, v.vendor_id, v.officer_id, v.category, v.description, v.status, v.remarks,
        v.vendor_notified_at, v.vendor_notice_message, v.created_at, v.resolved_at,
        s.stall_name, vp.name AS vendor_name, op.name AS officer_name
      FROM violations v
      LEFT JOIN stalls s ON s.id = v.stall_id
      LEFT JOIN profiles vp ON vp.id = v.vendor_id
      LEFT JOIN profiles op ON op.id = v.officer_id
      ${whereSql}
      ORDER BY v.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `, values);
    const evidenceMap = await getViolationEvidenceMap(rows.map((row) => row.id));
    res.json({ violations: rows.map((row) => mapViolationRow(row, evidenceMap)), total });
  } catch (error) { next(error); }
});

app.post("/api/violations", requireAuth, requireRole("admin", "super_admin", "officer", "vendor"), async (req, res, next) => {
  try {
    const stallId = String(req.body.stallId || "").trim();
    if (req.body.notifyVendor !== undefined && typeof req.body.notifyVendor !== "boolean") {
      return res.status(400).json({ message: "Notify vendor must be Yes or No." });
    }
    const notifyVendor = req.body.notifyVendor === true;
    if (notifyVendor && req.auth.role !== "officer") {
      return res.status(403).json({ message: "Only officers can notify a vendor about a violation." });
    }
    const vendorNoticeMessage = notifyVendor
      ? String(req.body.vendorNoticeMessage || "").trim() || null
      : null;
    // The client (mobile in particular) never actually sends this — resolve
    // it from whoever currently holds the stall, so the report shows a real
    // vendor name instead of always falling back to "Unknown".
    let vendorId = null;
    if (stallId) {
      const { rows: occupantRows } = await db.query(
        `SELECT a.user_id
         FROM applications a
         JOIN profiles p ON p.id = a.user_id
         WHERE a.stall_id = $1
           AND a.status = 'approved'
           AND p.is_archived = false
         ORDER BY a.date_applied DESC
         LIMIT 1`,
        [stallId]
      );
      vendorId = occupantRows[0]?.user_id ?? null;
    }
    if (notifyVendor && !vendorId) {
      return res.status(409).json({ message: "This stall has no active vendor to notify. Choose No to submit the report privately." });
    }
    const officerId = req.auth.role === "officer"
      ? req.auth.sub
      : req.body.officerId
        ? String(req.body.officerId).trim()
        : "44444444-4444-4444-8444-444444444444";
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();
    const status = String(req.body.status || "open");
    const remarks = String(req.body.remarks || "").trim();
    const evidence = Array.isArray(req.body.evidence) ? req.body.evidence : [];
    const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : new Date();
    const resolvedAt = req.body.resolvedAt ? new Date(req.body.resolvedAt) : (status === "open" ? null : new Date());
    if (!stallId || !category || !description) return res.status(400).json({ message: "Stall, category, and description are required." });

    const id = crypto.randomUUID();
    // Upload every attachment before writing anything, so a rejected photo
    // fails the whole request instead of creating a violation with evidence
    // that silently went missing.
    const storedEvidence = await storeAttachments("violations", id, evidence, req.auth.sub);

    const conn = await db.connect();
    try {
      await conn.query("BEGIN");
      await conn.query(
        `INSERT INTO violations
          (id, stall_id, vendor_id, officer_id, category, description, status, remarks,
           vendor_notified_at, vendor_notice_message, created_at, resolved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id, stallId, vendorId, officerId, category, description, status, remarks || null,
          notifyVendor ? new Date() : null, vendorNoticeMessage, createdAt, resolvedAt,
        ]
      );
      for (const file of storedEvidence) {
        await conn.query(
          "INSERT INTO violation_evidence (id, violation_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [crypto.randomUUID(), id, file.storagePath, file.fileName, file.mimeType, file.fileSize, req.auth.sub]
        );
      }
      await conn.query("COMMIT");
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
    res.status(201).json({ violation: (await listViolationsInternal(null, { includeArchived: true })).find((item) => item.id === id) });
  } catch (error) { next(error); }
});

app.patch("/api/violations/:id", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
    const updates = [];
    const values = [];
    if (req.body.officerId !== undefined) { values.push(String(req.body.officerId || "").trim()); updates.push(`officer_id = $${values.length}`); }
    if (req.body.category !== undefined) { values.push(String(req.body.category || "").trim()); updates.push(`category = $${values.length}`); }
    if (req.body.description !== undefined) { values.push(String(req.body.description || "").trim()); updates.push(`description = $${values.length}`); }
    if (req.body.status !== undefined) {
      const status = String(req.body.status);
      if (!["open", "reviewed", "resolved", "dismissed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
      }
      values.push(status);
      updates.push(`status = $${values.length}`);
      values.push(["open", "reviewed"].includes(status) ? null : new Date());
      updates.push(`resolved_at = $${values.length}`);
    }
    if (req.body.remarks !== undefined) { values.push(String(req.body.remarks || "").trim()); updates.push(`remarks = $${values.length}`); }
    // Uploaded to Storage before the transaction opens — a rejected/failed
    // upload should never hold a DB connection open waiting on it.
    let storedEvidence = [];
    if (Array.isArray(req.body.evidence) && req.body.evidence.length > 0) {
      // Files carrying an id are ones the client already had; re-inserting
      // them would duplicate the attachment list on every edit.
      const incoming = req.body.evidence.filter((file) => !file?.id);
      storedEvidence = await storeAttachments("violations", req.params.id, incoming, req.auth.sub);
    }
    const conn = await db.connect();
    try {
      await conn.query("BEGIN");
      if (updates.length > 0) {
        values.push(req.params.id);
        await conn.query(`UPDATE violations SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
      }
      for (const file of storedEvidence) {
        await conn.query(
          "INSERT INTO violation_evidence (id, violation_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [crypto.randomUUID(), req.params.id, file.storagePath, file.fileName, file.mimeType, file.fileSize, req.auth.sub]
        );
      }
      await conn.query("COMMIT");
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
    const updated = (await listViolationsInternal(null, { includeArchived: true })).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Violation not found." });
    res.json({ violation: updated });
  } catch (error) { next(error); }
});

app.get("/api/termination-requests", requireAuth, requireRole("admin", "super_admin", "vendor"), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req);
    if (limit == null) {
      return res.json({ requests: await listTerminationRequestsInternal() });
    }
    const total = Number((await db.query("SELECT COUNT(*) FROM termination_requests")).rows[0].count);
    const { rows } = await db.query(`
      SELECT
        tr.id, tr.type, tr.vendor_id, tr.stall_id, tr.reason, tr.status, tr.created_at, tr.resolved_at,
        vp.name AS vendor_name, vp.email AS vendor_email, s.stall_name,
        active.stalls AS active_stalls
      FROM termination_requests tr
      LEFT JOIN profiles vp ON vp.id = tr.vendor_id
      LEFT JOIN stalls s ON s.id = tr.stall_id
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('stallId', a.stall_id, 'stallName', st.stall_name, 'contractEnd', a.contract_end) ORDER BY a.contract_end) AS stalls
        FROM applications a
        JOIN stalls st ON st.id = a.stall_id
        WHERE a.user_id = tr.vendor_id AND a.status = 'approved'
      ) active ON tr.type = 'account'
      ORDER BY tr.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    res.json({ requests: rows.map(mapTerminationRequestRow), total });
  } catch (error) { next(error); }
});

app.post("/api/termination-requests", requireAuth, requireRole("admin", "super_admin", "vendor"), async (req, res, next) => {
  try {
    const type = String(req.body.type || "").trim();
    const reason = String(req.body.reason || "").trim();
    const stallId = req.body.stallId ? String(req.body.stallId).trim() : null;
    const vendorId = req.body.vendorId ? String(req.body.vendorId).trim() : req.auth.sub;
    const status = String(req.body.status || "pending").trim();
    const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : new Date();
    const resolvedAt = req.body.resolvedAt ? new Date(req.body.resolvedAt) : (status === "pending" ? null : new Date());
    if (!["account", "contract"].includes(type) || !reason) return res.status(400).json({ message: "Type and reason are required." });
    if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status." });
    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO termination_requests (id, type, vendor_id, stall_id, reason, status, created_at, resolved_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, type, vendorId, stallId, reason, status, createdAt, resolvedAt]
    );
    res.status(201).json({ request: (await listTerminationRequestsInternal()).find((item) => item.id === id) });
  } catch (error) { next(error); }
});

// Approving an "account" request archives the vendor and rejects their open
// applications atomically — all in one transaction, so a mid-way failure
// can't leave a vendor archived with their applications untouched (or vice
// versa). "contract" requests are unaffected: the client still drives that
// case with its own two calls, exactly as before.
app.patch("/api/termination-requests/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  const conn = await db.connect();
  try {
    const status = String(req.body.status || "").trim();
    if (!["pending", "approved", "rejected"].includes(status)) { conn.release(); return res.status(400).json({ message: "Invalid status." }); }

    await conn.query("BEGIN");
    const { rows: requestRows } = await conn.query("SELECT * FROM termination_requests WHERE id = $1 FOR UPDATE", [req.params.id]);
    const request = requestRows[0];
    if (!request) { await conn.query("ROLLBACK"); return res.status(404).json({ message: "Termination request not found." }); }

    if (status === "approved" && request.type === "account") {
      const { rows: vendorRows } = await conn.query("SELECT * FROM profiles WHERE id = $1", [request.vendor_id]);
      const vendor = vendorRows[0];
      if (vendor) {
        const { rows: rejectedApps } = await conn.query(
          `UPDATE applications
           SET status = 'rejected', admin_remarks = TRIM(BOTH E'\n' FROM COALESCE(admin_remarks, '') || E'\n\n' || 'Rejected — vendor account terminated.')
           WHERE user_id = $1 AND status IN ('pending', 'approved')
           RETURNING id, stall_id`,
          [vendor.id]
        );
        const archiveId = crypto.randomUUID();
        await conn.query(
          "INSERT INTO archive (id, type, title, description, original_id, original_data, archived_by, reason, can_restore) VALUES ($1, 'vendor', $2, $3, $4, $5, $6, $7, false)",
          [
            archiveId,
            vendor.name,
            `${vendor.email} — account terminated; ${rejectedApps.length} application(s) rejected.`,
            vendor.id,
            JSON.stringify({
              id: vendor.id, email: vendor.email, name: vendor.name, phone: vendor.phone,
              address: vendor.address, role: vendor.role, department: vendor.department, createdAt: vendor.created_at,
            }),
            req.auth.sub,
            request.reason,
          ]
        );
        await conn.query("UPDATE profiles SET is_archived = true WHERE id = $1", [vendor.id]);
        for (const app of rejectedApps) await syncStallOccupancy(app.stall_id, conn);
      }
    }

    await conn.query(
      "UPDATE termination_requests SET status = $1, resolved_at = $2 WHERE id = $3",
      [status, status === "pending" ? null : new Date(), req.params.id]
    );
    await conn.query("COMMIT");

    const updated = (await listTerminationRequestsInternal()).find((item) => item.id === req.params.id);
    res.json({ request: updated });
  } catch (error) { await conn.query("ROLLBACK"); next(error); } finally { conn.release(); }
});

app.get("/api/stalls", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const values = [];
    let whereSql = "";
    if (search) {
      values.push(`%${search}%`);
      whereSql = ` WHERE (stall_name ILIKE $${values.length} OR section ILIKE $${values.length} OR business_type ILIKE $${values.length})`;
    }

    let sql = `SELECT id, stall_name, status, business_type, section, floor, floor_area, notes, geometry, created_at FROM stalls${whereSql} ORDER BY created_at DESC`;
    let total;
    const { limit, offset } = parsePagination(req);
    if (limit != null) {
      total = Number((await db.query(`SELECT COUNT(*) FROM stalls${whereSql}`, values)).rows[0].count);
      values.push(limit); sql += ` LIMIT $${values.length}`;
      values.push(offset); sql += ` OFFSET $${values.length}`;
    }
    const { rows } = await db.query(sql, values);
    const imagesMap = await getStallImagesMap(rows.map((r) => r.id));
    res.json({
      stalls: rows.map(r => ({
        ...r,
        geometry: typeof r.geometry === "string" ? JSON.parse(r.geometry) : r.geometry,
        images: imagesMap.get(r.id) || [],
      })),
      ...(total !== undefined ? { total } : {}),
    });
    // Not ETag'd like map-facilities/perimeters: each stall's images carry a
    // freshly-signed Storage URL (new expiry token) on every request, so the
    // JSON body can never come out byte-identical twice — an ETag here would
    // never actually match, just adding a wasted hash on every call.
  } catch (error) { next(error); }
});

app.get("/api/stalls/management", async (req, res, next) => {
  try {
    const status = String(req.query.status || "").trim();
    const floor = String(req.query.floor || "").trim();
    const search = String(req.query.search || "").trim();
    const values = [];
    const conditions = [];
    if (status === "vacant") conditions.push("a.id IS NULL");
    else if (status === "pending") conditions.push("a.status = 'pending'");
    else if (status === "occupied") conditions.push("a.status = 'approved'");
    if (floor) { values.push(floor); conditions.push(`s.floor = $${values.length}`); }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(s.stall_name ILIKE $${values.length} OR s.business_type ILIKE $${values.length} OR s.section ILIKE $${values.length} OR a.business_name ILIKE $${values.length} OR p.name ILIKE $${values.length})`);
    }
    const whereSql = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";

    const baseSql = `
      FROM stalls s
      LEFT JOIN LATERAL (
        SELECT * FROM applications a2 WHERE a2.stall_id = s.id AND a2.status IN ('pending', 'approved') ORDER BY a2.date_applied DESC LIMIT 1
      ) a ON true
      LEFT JOIN profiles p ON a.user_id = p.id
    `;
    const selectSql = `
      SELECT
        s.id, s.stall_name, s.status, s.business_type, s.section, s.floor, s.floor_area, s.notes, s.geometry, s.created_at,
        a.id AS app_id, a.user_id AS app_user_id, a.business_name AS app_business_name, a.business_type AS app_business_type,
        a.contract_start AS app_contract_start, a.contract_term_months AS app_contract_term_months, a.contract_end AS app_contract_end,
        a.permit_path AS app_permit_path, a.additional_file_path AS app_additional_file_path, a.notes AS app_notes,
        a.status AS app_status, a.admin_remarks AS app_admin_remarks, a.date_applied AS app_date_applied,
        p.name AS app_applicant_name, p.email AS app_applicant_email,
        -- Application's own address if set, otherwise the vendor's profile one.
        COALESCE(a.applicant_address, p.address) AS app_applicant_address
      ${baseSql}${whereSql}
    `;

    let sql = `${selectSql} ORDER BY s.stall_name ASC`;
    let total;
    const { limit, offset } = parsePagination(req);
    if (limit != null) {
      total = Number((await db.query(`SELECT COUNT(*) ${baseSql}${whereSql}`, values)).rows[0].count);
      values.push(limit); sql += ` LIMIT $${values.length}`;
      values.push(offset); sql += ` OFFSET $${values.length}`;
    }
    const { rows } = await db.query(sql, values);
    const imagesMap = await getStallImagesMap(rows.map((r) => r.id));
    const items = await Promise.all(rows.map(async (r) => ({
      stall: {
        id: r.id, stall_name: r.stall_name, status: r.status, owner_id: null,
        business_type: r.business_type, section: r.section, floor: r.floor,
        floor_area: r.floor_area, notes: r.notes,
        geometry: typeof r.geometry === "string" ? JSON.parse(r.geometry) : r.geometry,
        created_at: r.created_at,
        images: imagesMap.get(r.id) || [],
      },
      app: r.app_id ? await mapApplicationRow({
        id: r.app_id, user_id: r.app_user_id, stall_id: r.id,
        business_name: r.app_business_name, business_type: r.app_business_type,
        contract_start: r.app_contract_start, contract_term_months: r.app_contract_term_months,
        contract_end: r.app_contract_end, permit_path: r.app_permit_path,
        additional_file_path: r.app_additional_file_path, notes: r.app_notes,
        status: r.app_status, admin_remarks: r.app_admin_remarks, date_applied: r.app_date_applied,
        stall_name: r.stall_name, section: r.section, floor_area: r.floor_area,
        applicant_name: r.app_applicant_name, applicant_email: r.app_applicant_email, applicant_address: r.app_applicant_address,
      }) : null,
    })));
    res.json({ items, ...(total !== undefined ? { total } : {}) });
  } catch (error) { next(error); }
});

// Purposes match the folder prefixes storeAttachments already uses; role
// checks mirror the existing write route for that resource. Only "stalls" is
// actually wired to a signed-upload flow yet (see POST /api/stalls) — the
// others are accepted here so future migrations don't need a new endpoint.
const UPLOAD_PURPOSES = new Set(["stalls", "permits", "violations", "checks", "receipts"]);
function canSignUploadFor(role, purpose) {
  if (purpose === "stalls") return ["admin", "super_admin"].includes(role);
  if (purpose === "permits") return ["vendor", "admin", "super_admin"].includes(role);
  if (purpose === "violations") return ["admin", "super_admin", "officer", "vendor"].includes(role);
  if (purpose === "checks") return ["admin", "super_admin", "officer"].includes(role);
  if (purpose === "receipts") return ["vendor", "officer"].includes(role);
  return false;
}

app.post("/api/uploads/sign", requireAuth, async (req, res, next) => {
  try {
    const purpose = String(req.body.purpose || "");
    const fileName = String(req.body.fileName || "").trim();
    const mimeType = String(req.body.mimeType || "").toLowerCase();
    const fileSize = Number(req.body.fileSize) || 0;
    if (!UPLOAD_PURPOSES.has(purpose)) return res.status(400).json({ message: "Invalid upload purpose." });
    if (!canSignUploadFor(req.auth.role, purpose)) return res.status(403).json({ message: "You cannot upload this type of file." });
    if (!fileName) return res.status(400).json({ message: "A file name is required." });
    if (!ALLOWED_ATTACHMENT_MIME.has(mimeType)) {
      return res.status(400).json({ message: `"${fileName}" is not an accepted file type. Upload a JPEG, PNG, WebP, HEIC image or a PDF.` });
    }
    if (fileSize <= 0 || fileSize > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ message: `"${fileName}" must be under ${humanSize(MAX_ATTACHMENT_BYTES)}.` });
    }
    if (!supabaseStorage) return res.status(500).json({ message: "File uploads are not configured." });

    // User-scoped, not entity-scoped: at signing time the domain record this
    // upload will belong to (a new stall, application, etc.) often doesn't
    // exist yet, so there's no entity id to fold into the path.
    const storagePath = `${purpose}/${req.auth.sub}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
    const { data, error } = await supabaseStorage.storage.from(ATTACHMENTS_BUCKET).createSignedUploadUrl(storagePath);
    if (error) return res.status(502).json({ message: `Could not prepare the upload: ${error.message}` });
    res.json({ path: data.path, token: data.token, signedUrl: data.signedUrl });
  } catch (error) { next(error); }
});

app.post("/api/stalls", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stall_name, business_type, section, floor, floor_area, notes, geometry } = req.body;
    if (!stall_name || !business_type || !section || !floor || !floor_area) return res.status(400).json({ message: "Missing required fields." });
    const images = Array.isArray(req.body.images) ? req.body.images : [];
    // A vacant stall with no photo is what this exists to prevent — the
    // server enforces it too, since a client-side check alone can be skipped.
    if (images.length === 0) return res.status(400).json({ message: "At least one stall photo is required." });
    // Images arrive either pre-uploaded via POST /api/uploads/sign (has
    // `.path`) or, for callers not yet migrated, as base64 (has `.base64`).
    const preSignedImages = images.filter((img) => img?.path);
    const legacyImages = images.filter((img) => !img?.path);

    const id = crypto.randomUUID();
    let preSignedResolved = [];
    let legacyResolved = [];
    try {
      preSignedResolved = await resolvePreSignedAttachments("stalls", req.auth.sub, preSignedImages);
      legacyResolved = await storeAttachments("stalls", id, legacyImages, req.auth.sub);
    } catch (error) {
      await Promise.all([...preSignedResolved, ...legacyResolved].map((f) => removeAttachment(f.storagePath)));
      throw error;
    }
    const storedImages = [...preSignedResolved, ...legacyResolved];

    const conn = await db.connect();
    try {
      await conn.query("BEGIN");
      await conn.query("INSERT INTO stalls (id, stall_name, status, business_type, section, floor, floor_area, notes, geometry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [id, stall_name, "vacant", business_type, section, floor, floor_area || "", notes || "", JSON.stringify(geometry)]);
      for (const file of storedImages) {
        await conn.query(
          "INSERT INTO stall_images (id, stall_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [crypto.randomUUID(), id, file.storagePath, file.fileName, file.mimeType, file.fileSize, req.auth.sub]
        );
      }
      await conn.query("COMMIT");
    } catch (innerError) {
      await conn.query("ROLLBACK");
      // The domain write failed after files were already confirmed real —
      // don't leave them orphaned in Storage with nothing referencing them.
      await Promise.all(storedImages.map((f) => removeAttachment(f.storagePath)));
      throw innerError;
    }
    finally { conn.release(); }
    const savedImages = (await getStallImagesMap([id])).get(id) || [];
    res.status(201).json({ stall: { id, stall_name, status: "vacant", owner_id: null, business_type, section, floor, floor_area, notes, geometry, created_at: new Date().toISOString(), images: savedImages } });
  } catch (error) { next(error); }
});

app.patch("/api/stalls/geometry", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) return res.status(400).json({ message: "Updates array is required and must not be empty." });
    const conn = await db.connect();
    try { await conn.query("BEGIN");
      for (const { id, geometry } of updates) { await conn.query("UPDATE stalls SET geometry = $1 WHERE id = $2", [JSON.stringify(geometry), id]); }
      await conn.query("COMMIT"); res.json({ ok: true });
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.patch("/api/stalls/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stall_name, business_type, section, floor, floor_area, notes, status } = req.body;
    const updates = []; const values = [];
    if (stall_name !== undefined) { values.push(stall_name); updates.push(`stall_name = $${values.length}`); }
    if (business_type !== undefined) { values.push(business_type); updates.push(`business_type = $${values.length}`); }
    if (section !== undefined) { values.push(section); updates.push(`section = $${values.length}`); }
    if (floor !== undefined) { values.push(floor); updates.push(`floor = $${values.length}`); }
    if (floor_area !== undefined) { values.push(floor_area); updates.push(`floor_area = $${values.length}`); }
    if (notes !== undefined) { values.push(notes); updates.push(`notes = $${values.length}`); }
    if (status !== undefined) { values.push(status); updates.push(`status = $${values.length}`); }
    // The full desired photo list, or null when the editor didn't touch photos
    // at all. Entries carrying an id are photos already stored; anything
    // already stored but missing from this list was removed in the editor.
    const images = Array.isArray(req.body.images) ? req.body.images : null;
    if (updates.length === 0 && images === null) return res.status(400).json({ message: "No fields to update." });
    // Only enforced when the caller actually sent a photo list (the stall
    // photo editor always does) — callers that patch unrelated fields, like
    // SuperAdminDashboard's status/business-type edit, never touch images
    // and so aren't held to this.
    if (images !== null && images.length === 0) {
      return res.status(400).json({ message: "At least one stall photo is required." });
    }

    // Uploaded to Storage before the transaction opens — a rejected/failed
    // upload should never hold a DB connection open waiting on it.
    let existingRows = [];
    let removed = [];
    let storedImages = [];
    if (images !== null) {
      const { rows } = await db.query("SELECT id, storage_path FROM stall_images WHERE stall_id = $1", [req.params.id]);
      existingRows = rows;
      const keptIds = new Set(images.filter((img) => img?.id).map((img) => img.id));
      removed = existingRows.filter((row) => !keptIds.has(row.id));
      const newFiles = images.filter((img) => !img?.id);
      // New images arrive either pre-uploaded via POST /api/uploads/sign
      // (has `.path`) or, for callers not yet migrated, as base64.
      const preSignedImages = newFiles.filter((img) => img?.path);
      const legacyImages = newFiles.filter((img) => !img?.path);
      let preSignedResolved = [];
      let legacyResolved = [];
      try {
        preSignedResolved = await resolvePreSignedAttachments("stalls", req.auth.sub, preSignedImages);
        legacyResolved = await storeAttachments("stalls", req.params.id, legacyImages, req.auth.sub);
      } catch (error) {
        await Promise.all([...preSignedResolved, ...legacyResolved].map((f) => removeAttachment(f.storagePath)));
        throw error;
      }
      storedImages = [...preSignedResolved, ...legacyResolved];
    }

    const conn = await db.connect();
    try {
      await conn.query("BEGIN");
      if (updates.length > 0) {
        values.push(req.params.id);
        await conn.query(`UPDATE stalls SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
      }
      for (const row of removed) {
        await conn.query("DELETE FROM stall_images WHERE id = $1", [row.id]);
      }
      for (const file of storedImages) {
        await conn.query(
          "INSERT INTO stall_images (id, stall_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [crypto.randomUUID(), req.params.id, file.storagePath, file.fileName, file.mimeType, file.fileSize, req.auth.sub]
        );
      }
      await conn.query("COMMIT");
    } catch (innerError) {
      await conn.query("ROLLBACK");
      // The domain write failed after files were already confirmed real —
      // don't leave them orphaned in Storage with nothing referencing them.
      await Promise.all(storedImages.map((f) => removeAttachment(f.storagePath)));
      throw innerError;
    }
    finally { conn.release(); }
    await Promise.all(removed.map((row) => removeAttachment(row.storage_path)));

    const { rows } = await db.query("SELECT id, stall_name, status, owner_id, business_type, section, floor, floor_area, notes, geometry, created_at FROM stalls WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Stall not found." });
    const row = rows[0];
    const savedImages = (await getStallImagesMap([req.params.id])).get(req.params.id) || [];
    res.json({ stall: { ...row, geometry: typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry, images: savedImages } });
  } catch (error) { next(error); }
});

async function findOwnedStallNames(ids) {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  const { rows } = await db.query(
    `SELECT DISTINCT s.stall_name FROM applications a JOIN stalls s ON s.id = a.stall_id WHERE a.stall_id IN (${placeholders}) AND a.status = 'approved'`,
    ids
  );
  return rows.map((r) => r.stall_name);
}

/**
 * Every stored file belonging to one stall. Collected before the rows are
 * deleted, because afterwards there is nothing left pointing at them and the
 * files would sit in Storage forever, consuming quota.
 */
async function collectStallAttachmentPaths(conn, id) {
  const { rows } = await conn.query(
    `SELECT permit_path AS p FROM applications WHERE stall_id = $1 AND permit_path IS NOT NULL
     UNION ALL
     SELECT additional_file_path FROM applications WHERE stall_id = $1 AND additional_file_path IS NOT NULL
     UNION ALL
     SELECT storage_path FROM payment_receipts WHERE stall_id = $1 AND storage_path <> ''
     UNION ALL
     SELECT ve.storage_path FROM violation_evidence ve
       JOIN violations v ON v.id = ve.violation_id WHERE v.stall_id = $1
     UNION ALL
     SELECT crf.storage_path FROM check_request_files crf
       JOIN check_requests cr ON cr.id = crf.check_request_id WHERE cr.stall_id = $1
     UNION ALL
     SELECT storage_path FROM stall_images WHERE stall_id = $1`,
    [id]
  );
  return rows.map((r) => r.p).filter(Boolean);
}

async function cascadeDeleteStall(conn, id) {
  await conn.query("DELETE FROM check_requests WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM violation_requests WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM violations WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM transfers WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM termination_requests WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM payment_receipts WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM applications WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM stall_images WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM stalls WHERE id = $1", [id]);
}

app.delete("/api/stalls", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "IDs array is required and must not be empty." });
    const ownedNames = await findOwnedStallNames(ids);
    if (ownedNames.length > 0) {
      return res.status(409).json({ message: `Cannot delete stall(s) currently owned by a vendor: ${ownedNames.join(", ")}.` });
    }
    const conn = await db.connect();
    try { await conn.query("BEGIN");
      // Gather file paths first — once the rows are gone nothing references
      // them, and the files would linger in Storage forever.
      const paths = [];
      for (const id of ids) { paths.push(...(await collectStallAttachmentPaths(conn, id))); }
      for (const id of ids) { await cascadeDeleteStall(conn, id); }
      await conn.query("COMMIT");
      // After the commit: if this fails the data is still correctly deleted.
      await Promise.all(paths.map(removeAttachment));
      res.json({ ok: true });
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.delete("/api/stalls/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const ownedNames = await findOwnedStallNames([req.params.id]);
    if (ownedNames.length > 0) {
      return res.status(409).json({ message: "Cannot delete a stall that is currently owned by a vendor. Terminate or transfer the tenancy first." });
    }
    const conn = await db.connect();
    try { await conn.query("BEGIN");
      const paths = await collectStallAttachmentPaths(conn, req.params.id);
      await cascadeDeleteStall(conn, req.params.id);
      await conn.query("COMMIT");
      await Promise.all(paths.map(removeAttachment));
      res.json({ ok: true });
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.post("/api/stalls/import", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stalls } = req.body;
    if (!Array.isArray(stalls)) return res.status(400).json({ message: "Stalls array is required." });
    const conn = await db.connect();
    try { await conn.query("BEGIN");
      const result = await importStallRows(conn, stalls.map(({ import_id, ...stall }) => stall));
      await conn.query("COMMIT"); res.status(201).json({ ok: true, ...result });
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.get("/api/applications", requireAuth, async (req, res, next) => {
  try {
    await autoTerminateExpiredPermitDeadlines();
    await autoTerminateExpiredContracts();

    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim();
    const values = [];
    const conditions = [];
    // A vendor may only ever see their own applications. This is also what
    // keeps permit documents private: a signed URL is only produced for rows
    // that survive this filter.
    if (req.auth.role === "vendor") {
      values.push(req.auth.sub);
      conditions.push(`a.user_id = $${values.length}`);
    } else {
      // Staff views only — a vendor should still see their own history even
      // after an admin archives one of their decided applications.
      conditions.push(`a.is_archived = false`);
    }
    if (status) { values.push(status); conditions.push(`a.status = $${values.length}`); }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${values.length} OR s.stall_name ILIKE $${values.length} OR a.business_name ILIKE $${values.length})`);
    }
    const whereSql = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";

    const APPLICATION_SORT_COLUMNS = { date: "a.date_applied", stall: "s.stall_name", status: "a.status" };
    const sortColumn = APPLICATION_SORT_COLUMNS[String(req.query.sortField || "")] || "a.date_applied";
    const sortDir = String(req.query.sortDir || "").toLowerCase() === "asc" ? "ASC" : "DESC";

    const baseSql = `
      FROM applications a
      LEFT JOIN stalls s ON a.stall_id = s.id
      LEFT JOIN profiles p ON a.user_id = p.id
      ${whereSql}
    `;
    let sql = `
      SELECT
        a.id, a.user_id, a.stall_id, a.business_name, a.business_type,
        a.contract_start, a.contract_term_months, a.contract_end, a.renewal_deadline_at, a.contract_terminated_at,
        a.approved_at, a.rejected_at, a.permit_uploaded_at, a.permit_path, a.additional_file_path,
        a.notes, a.status, a.admin_remarks, a.date_applied,
        s.stall_name, s.section, s.floor_area,
        p.name as applicant_name, p.email as applicant_email,
        -- The application's own address wins; older rows have none, so fall
        -- back to the vendor's profile address.
        a.applicant_address, p.address
      ${baseSql}
      ORDER BY ${sortColumn} ${sortDir}
    `;
    let total;
    const { limit, offset } = parsePagination(req);
    if (limit != null) {
      total = Number((await db.query(`SELECT COUNT(*) ${baseSql}`, values)).rows[0].count);
      values.push(limit); sql += ` LIMIT $${values.length}`;
      values.push(offset); sql += ` OFFSET $${values.length}`;
    }
    const { rows } = await db.query(sql, values);
    const applications = await Promise.all(rows.map(mapApplicationRow));
    res.json({ applications, ...(total !== undefined ? { total } : {}) });
  } catch (error) { next(error); }
});

/**
 * Which stalls have an approved application (`stallIds`) or a pending one
 * with no approval yet (`pendingStallIds`) — nothing else, no personal data.
 *
 * GET /api/applications above is scoped to the caller's own rows for
 * vendors, so it can no longer tell one vendor whether some *other* stall
 * has activity on it. `stallIds` is what broke the map after that scoping
 * was added: a stall approved for vendor A still showed as available to
 * vendor B. `pendingStallIds` exists so a stall someone has *applied* for —
 * decision still pending — reads as "pending" to every other vendor too,
 * not just to the applicant, even though the stall technically still
 * accepts further applications until one is approved.
 *
 * Public on purpose: the guest map (no login) needs this too, and stall ids
 * alone identify no one.
 */
app.get("/api/applications/occupied-stalls", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT DISTINCT stall_id, status FROM applications WHERE status IN ('approved', 'pending')"
    );
    const approved = new Set(rows.filter((r) => r.status === "approved").map((r) => r.stall_id));
    const pending = rows.filter((r) => r.status === "pending" && !approved.has(r.stall_id)).map((r) => r.stall_id);
    res.json({ stallIds: [...approved], pendingStallIds: pending });
  } catch (error) { next(error); }
});

app.post("/api/applications", requireAuth, requireRole("admin", "super_admin", "vendor"), async (req, res, next) => {
  try {
    const { stallId, businessName, businessType, contractStart, contractTermMonths, contractEnd, permit, additionalFile, notes, applicantAddress, vendorId } = req.body;
    if (!stallId || !businessName || !businessType || !contractStart || !contractTermMonths || !contractEnd) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // A vendor caller may only ever file for themselves — vendorId is only
    // honored for staff filing a walk-in application on someone else's
    // behalf. The target must be an active vendor account.
    let targetUserId = req.auth.sub;
    if ((req.auth.role === "admin" || req.auth.role === "super_admin") && vendorId) {
      const { rows: vendorRows } = await db.query(
        "SELECT id FROM profiles WHERE id = $1 AND role = 'vendor' AND is_archived = false",
        [vendorId]
      );
      if (!vendorRows[0]) return res.status(400).json({ message: "Selected vendor account was not found or is no longer active." });
      targetUserId = vendorId;
    }

    const id = crypto.randomUUID();
    // Upload both documents before inserting, and clean up the first if the
    // second is rejected, so a failed submission leaves nothing behind.
    const [storedPermit] = await storeAttachments("permits", id, permit ? [permit] : [], req.auth.sub);
    let storedAdditional;
    try {
      [storedAdditional] = await storeAttachments("permits", id, additionalFile ? [additionalFile] : [], req.auth.sub);
    } catch (error) {
      if (storedPermit) await removeAttachment(storedPermit.storagePath);
      throw error;
    }
    await db.query(
      "INSERT INTO applications (id, user_id, stall_id, business_name, business_type, contract_start, contract_term_months, contract_end, permit_path, additional_file_path, notes, applicant_address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [id, targetUserId, stallId, businessName, businessType, contractStart, parseInt(contractTermMonths), contractEnd, storedPermit?.storagePath || null, storedAdditional?.storagePath || null, notes || "", (applicantAddress || "").trim() || null]
    );
    const { rows } = await db.query(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.renewal_deadline_at, a.contract_terminated_at, a.approved_at, a.rejected_at, a.permit_uploaded_at, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, a.applicant_address, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = $1`,
      [id]
    );
    const app = await mapApplicationRow(rows[0]);
    res.status(201).json({ application: app });
  } catch (error) { next(error); }
});

app.patch("/api/applications/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    const updates = []; const values = [];
    if (status !== undefined) {
      values.push(status); updates.push(`status = $${values.length}`);
      // Stamps the decision moment, not just the decision — same idea as
      // contract_terminated_at already timestamping termination. Only an
      // explicit admin decision sets these; the two auto-termination paths
      // (autoTerminateExpiredContracts, autoTerminateExpiredPermitDeadlines)
      // deliberately do not, so they stay distinguishable on the tracking
      // timeline from a reviewed rejection.
      if (status === "approved") updates.push(`approved_at = NOW()`);
      if (status === "rejected") updates.push(`rejected_at = NOW()`);
    }
    if (adminRemarks !== undefined) { values.push(adminRemarks); updates.push(`admin_remarks = $${values.length}`); }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });
    values.push(req.params.id);
    await db.query(`UPDATE applications SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
    const { rows } = await db.query(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.renewal_deadline_at, a.contract_terminated_at, a.approved_at, a.rejected_at, a.permit_uploaded_at, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, a.applicant_address, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Application not found." });
    if (status !== undefined) await syncStallOccupancy(rows[0].stall_id);
    const app = await mapApplicationRow(rows[0]);
    res.json({ application: app });
  } catch (error) { next(error); }
});

app.patch("/api/applications/:id/permit", requireAuth, requireRole("admin", "super_admin", "vendor"), async (req, res, next) => {
  try {
    const permit = req.body.permit;
    if (!permit?.name) return res.status(400).json({ message: "A permit file is required." });

    // Apply an expired deadline before accepting a direct upload from an old
    // detail screen, so refreshing the application list cannot be bypassed.
    await autoTerminateExpiredPermitDeadlines();

    const { rows: existingRows } = await db.query(
      "SELECT id, user_id, status, admin_remarks, permit_path FROM applications WHERE id = $1",
      [req.params.id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ message: "Application not found." });
    if (req.auth.role === "vendor" && existing.user_id !== req.auth.sub) {
      return res.status(403).json({ message: "Access denied." });
    }

    const meta = parsePermitMeta(existing.admin_remarks || "");
    const visibleRemarks = meta.visibleRemarks.toLowerCase();
    if (
      meta.permitTerminatedAt ||
      visibleRemarks.includes("contract terminated") ||
      visibleRemarks.includes("application terminated because the business permit was not submitted")
    ) {
      return res.status(409).json({ message: "This application is no longer active, so its permit cannot be changed." });
    }

    const [stored] = await storeAttachments("permits", req.params.id, [permit], req.auth.sub);
    await db.query(
      "UPDATE applications SET permit_path = $1, admin_remarks = $2, permit_uploaded_at = NOW() WHERE id = $3",
      [stored.storagePath, buildPermitMetaRemarks(meta.visibleRemarks, {}), req.params.id]
    );
    // Drop the file this one replaced, so re-uploads don't accumulate.
    if (existing.permit_path && existing.permit_path !== stored.storagePath) {
      await removeAttachment(existing.permit_path);
    }

    const { rows } = await db.query(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.renewal_deadline_at, a.contract_terminated_at, a.approved_at, a.rejected_at, a.permit_uploaded_at, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, a.applicant_address, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Application not found." });
    res.json({ application: await mapApplicationRow(rows[0]) });
  } catch (error) { next(error); }
});

app.delete("/api/applications/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    // Read the file paths before the row goes, or the permit is stranded in
    // Storage with nothing left pointing at it.
    const { rows } = await db.query(
      "SELECT stall_id, permit_path, additional_file_path FROM applications WHERE id = $1",
      [req.params.id]
    );
    await db.query("DELETE FROM applications WHERE id = $1", [req.params.id]);
    if (rows[0]) {
      await removeAttachment(rows[0].permit_path);
      await removeAttachment(rows[0].additional_file_path);
      await syncStallOccupancy(rows[0].stall_id);
    }
    res.json({ ok: true });
  } catch (error) { next(error); }
});

const RENEWAL_SELECT = `
  SELECT rr.*, a.stall_id, a.contract_end, a.renewal_deadline_at,
    s.stall_name, p.name AS vendor_name, reviewer.name AS reviewed_by_name
  FROM contract_renewal_requests rr
  JOIN applications a ON a.id = rr.application_id
  LEFT JOIN stalls s ON s.id = a.stall_id
  LEFT JOIN profiles p ON p.id = rr.vendor_id
  LEFT JOIN profiles reviewer ON reviewer.id = rr.reviewed_by
`;

function mapRenewalRow(row) {
  return {
    id: row.id, applicationId: row.application_id, vendorId: row.vendor_id,
    vendorName: row.vendor_name || "Unknown", stallId: row.stall_id,
    stallName: row.stall_name || "Unknown", requestedMonths: row.requested_months,
    contractEnd: row.contract_end, renewalDeadlineAt: row.renewal_deadline_at,
    status: row.status, remarks: row.remarks || "", reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewed_by_name || null, reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

app.get("/api/contract-renewals", requireAuth, requireRole("vendor", "admin", "super_admin"), async (req, res, next) => {
  try {
    await autoTerminateExpiredContracts();
    const values = [];
    const where = req.auth.role === "vendor" ? (values.push(req.auth.sub), " WHERE rr.vendor_id = $1") : "";
    const { rows } = await db.query(`${RENEWAL_SELECT}${where} ORDER BY rr.created_at DESC`, values);
    res.json({ renewals: rows.map(mapRenewalRow) });
  } catch (error) { next(error); }
});

app.post("/api/contract-renewals", requireAuth, requireRole("vendor"), async (req, res, next) => {
  try {
    const applicationId = String(req.body.applicationId || "").trim();
    const requestedMonths = Number(req.body.requestedMonths);
    if (![6, 12, 24, 36].includes(requestedMonths)) return res.status(400).json({ message: "Choose a 6, 12, 24, or 36 month renewal." });
    const { rows: apps } = await db.query(
      "SELECT * FROM applications WHERE id = $1 AND user_id = $2", [applicationId, req.auth.sub]
    );
    const application = apps[0];
    if (!application || application.status !== "approved" || application.contract_terminated_at) return res.status(409).json({ message: "This contract is not eligible for renewal." });
    const deadline = application.renewal_deadline_at || new Date(new Date(application.contract_end).getTime() + 7 * 86400000);
    if (new Date(deadline).getTime() < Date.now()) return res.status(409).json({ message: "The renewal deadline has passed. Contact the Super Admin." });
    const { rows: pending } = await db.query("SELECT id FROM contract_renewal_requests WHERE application_id = $1 AND status = 'pending'", [applicationId]);
    if (pending[0]) return res.status(409).json({ message: "A renewal request is already pending." });
    const id = crypto.randomUUID();
    await db.query("INSERT INTO contract_renewal_requests (id, application_id, vendor_id, requested_months) VALUES ($1,$2,$3,$4)", [id, applicationId, req.auth.sub, requestedMonths]);
    const { rows } = await db.query(`${RENEWAL_SELECT} WHERE rr.id = $1`, [id]);
    res.status(201).json({ renewal: mapRenewalRow(rows[0]) });
  } catch (error) { next(error); }
});

app.patch("/api/contract-renewals/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  const conn = await db.connect();
  try {
    const status = String(req.body.status || "");
    const remarks = String(req.body.remarks || "").trim();
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Status must be approved or rejected." });
    await conn.query("BEGIN");
    const { rows } = await conn.query("SELECT * FROM contract_renewal_requests WHERE id = $1 FOR UPDATE", [req.params.id]);
    const renewal = rows[0];
    if (!renewal || renewal.status !== "pending") { await conn.query("ROLLBACK"); return res.status(409).json({ message: "This renewal is no longer pending." }); }
    if (status === "approved") {
      await conn.query("UPDATE applications SET contract_end = (GREATEST(contract_end, CURRENT_DATE) + make_interval(months => $1))::date, contract_term_months = $1, renewal_deadline_at = NULL, contract_terminated_at = NULL, status = 'approved' WHERE id = $2", [renewal.requested_months, renewal.application_id]);
    }
    await conn.query("UPDATE contract_renewal_requests SET status=$1, remarks=$2, reviewed_by=$3, reviewed_at=NOW() WHERE id=$4", [status, remarks || null, req.auth.sub, req.params.id]);
    await conn.query("COMMIT");
    const result = await db.query(`${RENEWAL_SELECT} WHERE rr.id = $1`, [req.params.id]);
    res.json({ renewal: mapRenewalRow(result.rows[0]) });
  } catch (error) { await conn.query("ROLLBACK"); next(error); } finally { conn.release(); }
});

app.patch("/api/applications/:id/renewal-deadline", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    const newDeadline = new Date(req.body.deadlineAt);
    const reason = String(req.body.reason || "").trim();
    if (Number.isNaN(newDeadline.getTime()) || newDeadline.getTime() <= Date.now()) return res.status(400).json({ message: "Choose a future renewal deadline." });
    if (!reason) return res.status(400).json({ message: "An extension reason is required." });
    const { rows } = await db.query("SELECT contract_end, renewal_deadline_at, contract_terminated_at FROM applications WHERE id=$1", [req.params.id]);
    const appRow = rows[0];
    if (!appRow || appRow.contract_terminated_at) return res.status(409).json({ message: "A terminated contract deadline cannot be extended." });
    const previous = appRow.renewal_deadline_at || new Date(new Date(appRow.contract_end).getTime() + 7 * 86400000);
    await db.query("UPDATE applications SET renewal_deadline_at=$1 WHERE id=$2", [newDeadline, req.params.id]);
    await db.query("INSERT INTO renewal_deadline_extensions (id,application_id,previous_deadline_at,new_deadline_at,reason,extended_by) VALUES ($1,$2,$3,$4,$5,$6)", [crypto.randomUUID(), req.params.id, previous, newDeadline, reason, req.auth.sub]);
    res.json({ renewalDeadlineAt: newDeadline.toISOString() });
  } catch (error) { next(error); }
});

// ── Payment Receipts ──────────────────────────────────────────────────────────
async function mapPaymentReceiptRow(row) {
  return {
    id: row.id,
    stallId: row.stall_id,
    stallName: row.stall_name,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name || "Unknown",
    submittedBy: row.submitted_by,
    submittedByName: row.submitted_by_name || "Unknown",
    submittedByRole: row.submitted_by_role,
    amount: row.amount !== null ? Number(row.amount) : null,
    receiptDate: row.receipt_date,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    fileUrl: await signedUrlFor(row.storage_path),
    notes: row.notes || "",
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewed_by_name || null,
    reviewedAt: row.reviewed_at,
    remarks: row.remarks || "",
    createdAt: row.created_at,
  };
}

const PAYMENT_RECEIPT_SELECT = `
  SELECT
    pr.id, pr.stall_id, pr.vendor_id, pr.submitted_by, pr.amount, pr.receipt_date,
    pr.storage_path, pr.file_name, pr.mime_type, pr.file_size, pr.notes, pr.status,
    pr.reviewed_by, pr.reviewed_at, pr.remarks, pr.created_at,
    s.stall_name,
    vp.name AS vendor_name,
    sp.name AS submitted_by_name, sp.role AS submitted_by_role,
    rp.name AS reviewed_by_name
  FROM payment_receipts pr
  LEFT JOIN stalls s ON s.id = pr.stall_id
  LEFT JOIN profiles vp ON vp.id = pr.vendor_id
  LEFT JOIN profiles sp ON sp.id = pr.submitted_by
  LEFT JOIN profiles rp ON rp.id = pr.reviewed_by
`;

app.get("/api/receipts", requireAuth, requireRole("vendor", "officer", "admin", "super_admin"), async (req, res, next) => {
  try {
    let where = "";
    const params = [];
    if (req.auth.role === "vendor") { params.push(req.auth.sub); where = `WHERE pr.vendor_id = $${params.length}`; }
    else if (req.auth.role === "officer") { params.push(req.auth.sub); where = `WHERE pr.submitted_by = $${params.length}`; }
    let sql = `${PAYMENT_RECEIPT_SELECT} ${where} ORDER BY pr.created_at DESC`;
    let total;
    const { limit, offset } = parsePagination(req);
    if (limit != null) {
      total = Number((await db.query(`SELECT COUNT(*) FROM payment_receipts pr ${where}`, params)).rows[0].count);
      params.push(limit); sql += ` LIMIT $${params.length}`;
      params.push(offset); sql += ` OFFSET $${params.length}`;
    }
    const { rows } = await db.query(sql, params);
    const receipts = await Promise.all(rows.map(mapPaymentReceiptRow));
    res.json({ receipts, ...(total !== undefined ? { total } : {}) });
  } catch (error) { next(error); }
});

app.post("/api/receipts", requireAuth, requireRole("vendor", "officer"), async (req, res, next) => {
  try {
    const stallId = String(req.body.stallId || "").trim();
    const amount = req.body.amount !== undefined && req.body.amount !== null && req.body.amount !== "" ? Number(req.body.amount) : null;
    const receiptDate = req.body.receiptDate ? new Date(req.body.receiptDate) : new Date();
    const notes = String(req.body.notes || "").trim();
    const file = req.body.file || {};
    if (!stallId) return res.status(400).json({ message: "Stall is required." });
    // base64 is optional: clients that can upload the real file (the web app)
    // send it and it goes to Storage. Clients that only record the file's name
    // — the same way permits and violation evidence work — may omit it.
    if (!file.name || !file.type) return res.status(400).json({ message: "A receipt file is required." });
    if (amount !== null && !Number.isFinite(amount)) return res.status(400).json({ message: "Amount must be a number." });

    const { rows: activeAppRows } = await db.query(
      "SELECT user_id FROM applications WHERE stall_id = $1 AND status = 'approved' ORDER BY date_applied DESC LIMIT 1",
      [stallId]
    );
    const activeVendorId = activeAppRows[0]?.user_id || null;

    let vendorId;
    if (req.auth.role === "vendor") {
      if (activeVendorId !== req.auth.sub) return res.status(403).json({ message: "You do not have an approved application for this stall." });
      vendorId = req.auth.sub;
    } else {
      if (!activeVendorId) return res.status(400).json({ message: "No active vendor for this stall." });
      vendorId = activeVendorId;
    }

    const id = crypto.randomUUID();
    // Upload first: if the file is rejected (too large, wrong type) we fail
    // before writing a row, rather than leaving a receipt with no file.
    let storagePath = "";
    let byteSize = Number(file.size) || 0;
    if (hasFileContents(file)) {
      const uploaded = await uploadAttachment("receipts", id, file);
      storagePath = uploaded.storagePath;
      byteSize = uploaded.byteSize;
    }
    await db.query(
      "INSERT INTO payment_receipts (id, stall_id, vendor_id, submitted_by, amount, receipt_date, storage_path, file_name, mime_type, file_size, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [id, stallId, vendorId, req.auth.sub, amount, receiptDate, storagePath, file.name, file.type, byteSize, notes || null]
    );

    const { rows } = await db.query(`${PAYMENT_RECEIPT_SELECT} WHERE pr.id = $1`, [id]);
    res.status(201).json({ receipt: await mapPaymentReceiptRow(rows[0]) });
  } catch (error) { next(error); }
});

app.patch("/api/receipts/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const status = String(req.body.status || "");
    if (!["verified", "rejected"].includes(status)) return res.status(400).json({ message: "Status must be 'verified' or 'rejected'." });
    const remarks = req.body.remarks !== undefined ? String(req.body.remarks || "").trim() : null;
    await db.query(
      "UPDATE payment_receipts SET status = $1, remarks = $2, reviewed_by = $3, reviewed_at = $4 WHERE id = $5",
      [status, remarks, req.auth.sub, new Date(), req.params.id]
    );
    const { rows } = await db.query(`${PAYMENT_RECEIPT_SELECT} WHERE pr.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Receipt not found." });
    res.json({ receipt: await mapPaymentReceiptRow(rows[0]) });
  } catch (error) { next(error); }
});

// ── Archive ───────────────────────────────────────────────────────────────────
// Previously localStorage-only, so archived records lived in one admin's
// browser and were invisible to everyone else.

const ARCHIVE_SELECT = `
  SELECT a.id, a.type, a.title, a.description, a.original_id, a.original_data,
         a.archived_by, a.reason, a.can_restore, a.archived_at,
         p.name AS archived_by_name
  FROM archive a
  LEFT JOIN profiles p ON p.id = a.archived_by
`;

function mapArchiveRow(r) {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description ?? "",
    originalId: r.original_id,
    originalData: typeof r.original_data === "string" ? JSON.parse(r.original_data) : r.original_data,
    archivedBy: r.archived_by,
    archivedByName: r.archived_by_name ?? "Unknown",
    reason: r.reason ?? "",
    canRestore: r.can_restore,
    archivedAt: r.archived_at,
  };
}

app.get("/api/archive", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    let sql = `${ARCHIVE_SELECT} ORDER BY a.archived_at DESC`;
    let total;
    const { limit, offset } = parsePagination(req);
    const values = [];
    if (limit != null) {
      total = Number((await db.query("SELECT COUNT(*) FROM archive")).rows[0].count);
      values.push(limit); sql += ` LIMIT $${values.length}`;
      values.push(offset); sql += ` OFFSET $${values.length}`;
    }
    const { rows } = await db.query(sql, values);
    res.json({ records: rows.map(mapArchiveRow), ...(total !== undefined ? { total } : {}) });
  } catch (error) { next(error); }
});

// Archiving a completed application or violation never deletes it — the row
// stays exactly as it is, just flagged with `is_archived`, which is what
// makes it disappear from the working admin lists (GET /api/applications,
// GET /api/violations) while remaining fully intact in the database and
// now also catalogued here. Only records that are actually done (a decided
// application, a closed-out violation) can be archived this way, so nothing
// still in progress can vanish from view by mistake.
app.post("/api/archive", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  const conn = await db.connect();
  try {
    const type = String(req.body.type || "").trim();
    const title = String(req.body.title || "").trim();
    const originalId = String(req.body.originalId || "").trim();
    if (!["application", "vendor", "stall", "violation", "check_request"].includes(type)) {
      conn.release();
      return res.status(400).json({ message: "Invalid archive type." });
    }
    if (!title || !originalId) { conn.release(); return res.status(400).json({ message: "Title and original record are required." }); }

    await conn.query("BEGIN");

    if (type === "application") {
      const { rows } = await conn.query("SELECT status FROM applications WHERE id = $1 FOR UPDATE", [originalId]);
      if (!rows[0]) { await conn.query("ROLLBACK"); return res.status(404).json({ message: "Application not found." }); }
      if (rows[0].status !== "rejected") { await conn.query("ROLLBACK"); return res.status(409).json({ message: "Only a decided (rejected/terminated) application can be archived." }); }
      await conn.query("UPDATE applications SET is_archived = true WHERE id = $1", [originalId]);
    } else if (type === "violation") {
      const { rows } = await conn.query("SELECT status FROM violations WHERE id = $1 FOR UPDATE", [originalId]);
      if (!rows[0]) { await conn.query("ROLLBACK"); return res.status(404).json({ message: "Violation not found." }); }
      if (!["resolved", "dismissed"].includes(rows[0].status)) { await conn.query("ROLLBACK"); return res.status(409).json({ message: "Only a resolved or dismissed violation can be archived." }); }
      await conn.query("UPDATE violations SET is_archived = true WHERE id = $1", [originalId]);
    } else if (type === "check_request") {
      const { rows } = await conn.query("SELECT status FROM check_requests WHERE id = $1 FOR UPDATE", [originalId]);
      if (!rows[0]) { await conn.query("ROLLBACK"); return res.status(404).json({ message: "Inspection request not found." }); }
      if (rows[0].status !== "completed") { await conn.query("ROLLBACK"); return res.status(409).json({ message: "Only a completed inspection can be archived." }); }
      await conn.query("UPDATE check_requests SET is_archived = true WHERE id = $1", [originalId]);
    }

    const id = crypto.randomUUID();
    await conn.query(
      `INSERT INTO archive (id, type, title, description, original_id, original_data, archived_by, reason, can_restore)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        type,
        title,
        String(req.body.description || ""),
        originalId,
        JSON.stringify(req.body.originalData ?? {}),
        req.auth.sub,
        String(req.body.reason || ""),
        req.body.canRestore !== false,
      ]
    );
    await conn.query("COMMIT");

    const { rows } = await db.query(`${ARCHIVE_SELECT} WHERE a.id = $1`, [id]);
    res.status(201).json({ record: mapArchiveRow(rows[0]) });
  } catch (error) { await conn.query("ROLLBACK"); next(error); } finally { conn.release(); }
});

app.delete("/api/archive/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    await db.query("DELETE FROM archive WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

// ── Stall ownership transfers ─────────────────────────────────────────────────
// Previously browser-only (localStorage), which meant a transfer offer never
// reached the recipient — they'd look in their own browser and find nothing.
// Now shared through the database like everything else.

const TRANSFER_SELECT = `
  SELECT
    t.id, t.from_user_id, t.to_user_id, t.stall_id, t.original_application_id,
    t.status, t.created_at, t.responded_at,
    fp.name AS from_user_name, fp.email AS from_user_email,
    tp.name AS to_user_name, tp.email AS to_user_email,
    s.stall_name, s.section AS stall_section, s.floor AS stall_floor, s.floor_area
  FROM transfers t
  LEFT JOIN profiles fp ON fp.id = t.from_user_id
  LEFT JOIN profiles tp ON tp.id = t.to_user_id
  LEFT JOIN stalls s ON s.id = t.stall_id
`;

// Shaped to match what the UI already expected from the old localStorage store.
function mapTransferRow(r) {
  return {
    id: r.id,
    fromUserId: r.from_user_id,
    fromUserName: r.from_user_name,
    fromUserEmail: r.from_user_email,
    toUserId: r.to_user_id,
    toUserName: r.to_user_name,
    toUserEmail: r.to_user_email,
    stallId: r.stall_id,
    stallName: r.stall_name,
    stallSection: r.stall_section,
    stallFloor: r.stall_floor,
    floorArea: r.floor_area,
    originalApplicationId: r.original_application_id,
    status: r.status,
    createdAt: r.created_at,
    respondedAt: r.responded_at,
  };
}

app.get("/api/transfers", requireAuth, async (req, res, next) => {
  try {
    // Vendors only see transfers they sent or received; staff see everything.
    const isStaff = ["admin", "super_admin"].includes(req.auth.role);
    const where = isStaff ? "" : "WHERE t.from_user_id = $1 OR t.to_user_id = $1";
    const values = isStaff ? [] : [req.auth.sub];
    let sql = `${TRANSFER_SELECT} ${where} ORDER BY t.created_at DESC`;
    let total;
    const { limit, offset } = parsePagination(req);
    if (limit != null) {
      total = Number((await db.query(`SELECT COUNT(*) FROM transfers t ${where}`, values)).rows[0].count);
      values.push(limit); sql += ` LIMIT $${values.length}`;
      values.push(offset); sql += ` OFFSET $${values.length}`;
    }
    const { rows } = await db.query(sql, values);
    res.json({ transfers: rows.map(mapTransferRow), ...(total !== undefined ? { total } : {}) });
  } catch (error) { next(error); }
});

app.post("/api/transfers", requireAuth, requireRole("vendor"), async (req, res, next) => {
  try {
    const stallId = String(req.body.stallId || "").trim();
    const toUserEmail = String(req.body.toUserEmail || "").trim().toLowerCase();
    const originalApplicationId = String(req.body.originalApplicationId || "").trim();
    if (!stallId || !toUserEmail || !originalApplicationId) {
      return res.status(400).json({ message: "Stall, recipient email, and application are required." });
    }

    const { rows: recipients } = await db.query("SELECT id, role FROM profiles WHERE email = $1 LIMIT 1", [toUserEmail]);
    const recipient = recipients[0];
    if (!recipient) return res.status(404).json({ message: "No PubMark account found with this email." });
    if (recipient.id === req.auth.sub) return res.status(400).json({ message: "You cannot transfer a stall to yourself." });

    // The sender must actually hold this stall via an approved application.
    const { rows: owned } = await db.query(
      "SELECT id FROM applications WHERE id = $1 AND stall_id = $2 AND user_id = $3 AND status = 'approved' LIMIT 1",
      [originalApplicationId, stallId, req.auth.sub]
    );
    if (!owned[0]) return res.status(403).json({ message: "You can only transfer a stall you currently hold." });

    // One open offer per stall, so a stall can't be promised twice.
    const { rows: existing } = await db.query(
      "SELECT id FROM transfers WHERE stall_id = $1 AND status = 'pending' LIMIT 1",
      [stallId]
    );
    if (existing[0]) return res.status(409).json({ message: "There is already a pending transfer for this stall." });

    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO transfers (id, from_user_id, to_user_id, stall_id, original_application_id, status) VALUES ($1, $2, $3, $4, $5, 'pending')",
      [id, req.auth.sub, recipient.id, stallId, originalApplicationId]
    );
    const { rows } = await db.query(`${TRANSFER_SELECT} WHERE t.id = $1`, [id]);
    res.status(201).json({ transfer: mapTransferRow(rows[0]) });
  } catch (error) { next(error); }
});

app.patch("/api/transfers/:id", requireAuth, async (req, res, next) => {
  try {
    const status = String(req.body.status || "").trim();
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Status must be accepted or declined." });
    }

    const { rows: found } = await db.query("SELECT * FROM transfers WHERE id = $1 LIMIT 1", [req.params.id]);
    const transfer = found[0];
    if (!transfer) return res.status(404).json({ message: "Transfer not found." });
    if (transfer.status !== "pending") return res.status(409).json({ message: "This transfer has already been answered." });

    // Only the recipient decides; staff may also intervene.
    const isStaff = ["admin", "super_admin"].includes(req.auth.role);
    if (!isStaff && transfer.to_user_id !== req.auth.sub) {
      return res.status(403).json({ message: "Only the recipient can respond to this transfer." });
    }

    await db.query("UPDATE transfers SET status = $1, responded_at = now() WHERE id = $2", [status, req.params.id]);
    const { rows } = await db.query(`${TRANSFER_SELECT} WHERE t.id = $1`, [req.params.id]);
    res.json({ transfer: mapTransferRow(rows[0]) });
  } catch (error) { next(error); }
});

// ── Market Perimeters (multi-zone) ────────────────────────────────────────────
const FACILITY_TYPES = new Set(["entrance", "cr", "stairs", "office", "technical_room"]);
const FACILITY_FLOORS = new Set(["1", "2"]);
const FACILITY_LABELS = { entrance: "Entrance", cr: "CR", stairs: "Stairs", office: "Office", technical_room: "Technical Room" };
const FACILITY_AREA_TYPES = new Set(["cr", "office", "technical_room"]);

function validFacilityPosition(position) {
  return Array.isArray(position) && position.length >= 2 && Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function validFacilityGeometry(type, geometry) {
  if (!geometry || typeof geometry !== "object") return false;
  if (FACILITY_AREA_TYPES.has(type)) {
    const ring = geometry.type === "Polygon" ? geometry.coordinates?.[0] : null;
    return Array.isArray(ring) && ring.length >= 4 && ring.every(validFacilityPosition) &&
      ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  }
  return geometry.type === "Point" && validFacilityPosition(geometry.coordinates);
}

function normalizeConnectedFloors(type, floor, value) {
  if (type !== "stairs") return null;
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String))].filter((item) => FACILITY_FLOORS.has(item) && item !== floor);
}

function mapFacilityRow(row) {
  return {
    id: row.id, type: row.type, name: FACILITY_LABELS[row.type] ?? row.name, floor: row.floor,
    geometry: typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry,
    connectedFloors: Array.isArray(row.connected_floors) ? row.connected_floors
      : typeof row.connected_floors === "string" ? JSON.parse(row.connected_floors) : [],
    isAccessible: Boolean(row.is_accessible), notes: row.notes || "", createdAt: row.created_at,
  };
}

app.get("/api/map-facilities", async (req, res, next) => {
  try {
    const floor = req.query.floor ? String(req.query.floor) : null;
    if (floor && !FACILITY_FLOORS.has(floor)) return res.status(400).json({ message: "Floor must be 1 or 2." });
    const { rows } = await db.query("SELECT * FROM map_facilities ORDER BY type, name");
    const facilities = rows.map(mapFacilityRow).filter((item) => !floor || item.floor === floor || item.connectedFloors.includes(floor));
    sendWithETag(req, res, { facilities });
  } catch (error) { next(error); }
});

app.post("/api/map-facilities", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    const type = String(req.body.type || "");
    const name = FACILITY_LABELS[type];
    const floor = String(req.body.floor || "");
    const { geometry } = req.body;
    if (!FACILITY_TYPES.has(type)) return res.status(400).json({ message: "Unsupported facility type." });
    if (!FACILITY_FLOORS.has(floor)) return res.status(400).json({ message: "Floor must be 1 or 2." });
    if (!validFacilityGeometry(type, geometry)) return res.status(400).json({ message: `Invalid geometry for ${type}.` });
    const connectedFloors = normalizeConnectedFloors(type, floor, req.body.connectedFloors);
    const id = crypto.randomUUID();
    const { rows } = await db.query(
      `INSERT INTO map_facilities (id,type,name,floor,geometry,connected_floors,is_accessible,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, type, name, floor, JSON.stringify(geometry), connectedFloors ? JSON.stringify(connectedFloors) : null,
        Boolean(req.body.isAccessible), String(req.body.notes || "").trim(), req.auth.sub]
    );
    res.status(201).json({ facility: mapFacilityRow(rows[0]) });
  } catch (error) { next(error); }
});

app.patch("/api/map-facilities/:id", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    const found = await db.query("SELECT * FROM map_facilities WHERE id = $1", [req.params.id]);
    if (!found.rows[0]) return res.status(404).json({ message: "Facility not found." });
    const current = mapFacilityRow(found.rows[0]);
    const value = {
      type: req.body.type === undefined ? current.type : String(req.body.type),
      name: FACILITY_LABELS[req.body.type === undefined ? current.type : String(req.body.type)],
      floor: req.body.floor === undefined ? current.floor : String(req.body.floor),
      geometry: req.body.geometry === undefined ? current.geometry : req.body.geometry,
      isAccessible: req.body.isAccessible === undefined ? current.isAccessible : Boolean(req.body.isAccessible),
      notes: req.body.notes === undefined ? current.notes : String(req.body.notes).trim(),
    };
    if (!FACILITY_TYPES.has(value.type)) return res.status(400).json({ message: "Unsupported facility type." });
    if (!FACILITY_FLOORS.has(value.floor)) return res.status(400).json({ message: "Floor must be 1 or 2." });
    if (!validFacilityGeometry(value.type, value.geometry)) return res.status(400).json({ message: `Invalid geometry for ${value.type}.` });
    const connectedInput = req.body.connectedFloors === undefined ? current.connectedFloors : req.body.connectedFloors;
    const connectedFloors = normalizeConnectedFloors(value.type, value.floor, connectedInput);
    const { rows } = await db.query(
      `UPDATE map_facilities SET type=$1,name=$2,floor=$3,geometry=$4,connected_floors=$5,is_accessible=$6,notes=$7,updated_at=now()
       WHERE id=$8 RETURNING *`,
      [value.type, value.name, value.floor, JSON.stringify(value.geometry), connectedFloors ? JSON.stringify(connectedFloors) : null,
        value.isAccessible, value.notes, req.params.id]
    );
    res.json({ facility: mapFacilityRow(rows[0]) });
  } catch (error) { next(error); }
});

app.delete("/api/map-facilities/:id", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    const result = await db.query("DELETE FROM map_facilities WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: "Facility not found." });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/perimeters", async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT mp.id, mp.name, mp.geometry, mp.created_by, mp.notes, mp.created_at, p.name AS created_by_name
      FROM market_perimeter mp
      LEFT JOIN profiles p ON mp.created_by = p.id
      ORDER BY mp.created_at ASC
    `);
    const perimeters = rows.map((row) => ({
      id: row.id,
      name: row.name,
      geometry: typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry,
      createdBy: row.created_by,
      createdByName: row.created_by_name || "Unknown",
      notes: row.notes || "",
      createdAt: row.created_at,
    }));
    sendWithETag(req, res, { perimeters });
  } catch (error) { next(error); }
});

app.post("/api/perimeters", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    const { name, geometry, notes } = req.body;
    if (!name || !geometry) return res.status(400).json({ message: "Name and geometry are required." });
    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO market_perimeter (id, name, geometry, created_by, notes) VALUES ($1, $2, $3, $4, $5)",
      [id, name, JSON.stringify(geometry), req.auth.sub, notes || ""]
    );
    const { rows } = await db.query(`
      SELECT mp.id, mp.name, mp.geometry, mp.created_by, mp.notes, mp.created_at, p.name AS created_by_name
      FROM market_perimeter mp
      LEFT JOIN profiles p ON mp.created_by = p.id
      WHERE mp.id = $1
    `, [id]);
    const perimeter = {
      id: rows[0].id,
      name: rows[0].name,
      geometry: typeof rows[0].geometry === "string" ? JSON.parse(rows[0].geometry) : rows[0].geometry,
      createdBy: rows[0].created_by,
      createdByName: rows[0].created_by_name || "Unknown",
      notes: rows[0].notes || "",
      createdAt: rows[0].created_at,
    };
    res.status(201).json({ perimeter });
  } catch (error) { next(error); }
});

app.delete("/api/perimeters/:id", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    await db.query("DELETE FROM market_perimeter WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  // Attachment problems (too large, wrong type, upload rejected) carry a
  // message written for the person uploading, so pass it through instead of
  // flattening it into a generic 500 they cannot act on.
  if (error instanceof AttachmentError) {
    return res.status(error.status || 400).json({ message: error.message });
  }
  if (error instanceof GoogleAuthError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  // express.json() rejects bodies over its limit before any route runs.
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ message: `That file is too large. The limit is ${humanSize(MAX_ATTACHMENT_BYTES)} per file.` });
  }
  res.status(500).json({ message: "Unexpected server error." });
});
app.listen(port, () => console.log(`PubMark API listening on ${port}`));

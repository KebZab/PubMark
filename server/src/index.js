import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is required.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Copy server/.env.example to server/.env and fill in real values.");
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const configuredOrigins = (process.env.CLIENT_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean);
const localDevelopmentOrigins = [
  "http://localhost:5173", "http://localhost:5174",
  "http://127.0.0.1:5173", "http://127.0.0.1:5174",
];
const allowedOrigins = new Set([...configuredOrigins, ...localDevelopmentOrigins]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

function cookieOptions() { return { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }; }
function setSession(res, profile) { res.cookie("pubmark_session", jwt.sign({ sub: profile.id, role: profile.role }, jwtSecret, { expiresIn: "8h" }), cookieOptions()); }
function requireAuth(req, res, next) {
  try { req.auth = jwt.verify(req.headers.cookie?.match(/(?:^|; )pubmark_session=([^;]+)/)?.[1] || "", jwtSecret); next(); }
  catch { res.status(401).json({ message: "Sign in is required." }); }
}
function profile(row) { return { id: row.id, email: row.email, name: row.name, role: row.role, address: row.address, phone: row.phone, department: row.department, createdAt: row.created_at }; }
function requireRole(...roles) { return (req, res, next) => { if (!roles.includes(req.auth?.role)) return res.status(403).json({ message: "Access denied." }); next(); }; }

function mapAnnouncementRow(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
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

function mapCompletionMimeType(type) {
  if (type === "image") return "image/*";
  if (type === "video") return "video/*";
  return "application/octet-stream";
}

function mapCompletionFileType(mimeType) {
  if ((mimeType || "").startsWith("image/")) return "image";
  if ((mimeType || "").startsWith("video/")) return "video";
  return "document";
}

function parseDisplaySizeToBytes(size) {
  const match = String(size || "").trim().match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return Number.isFinite(value) ? Math.round(value * multipliers[unit]) : 0;
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
    `SELECT check_request_id, file_name, mime_type, file_size FROM check_request_files WHERE check_request_id IN (${placeholders}) ORDER BY created_at ASC`,
    requestIds
  );
  const filesMap = new Map();
  for (const row of rows) {
    const existing = filesMap.get(row.check_request_id) || [];
    existing.push({
      name: row.file_name,
      type: mapCompletionFileType(row.mime_type),
      size: formatBytes(row.file_size),
    });
    filesMap.set(row.check_request_id, existing);
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
    status: row.status,
    assignedOfficerId: row.assigned_officer_id,
    assignedOfficerName: row.assigned_officer_name,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function listCheckRequestsInternal() {
  const { rows } = await db.query(`
    SELECT
      cr.id, cr.stall_id, cr.requested_by, cr.assigned_to, cr.priority, cr.reason, cr.notes,
      cr.status, cr.created_at, cr.completed_at, cr.completion_notes, cr.completion_summary,
      s.stall_name,
      rp.name AS requested_by_name,
      ap.name AS assigned_to_name
    FROM check_requests cr
    LEFT JOIN stalls s ON s.id = cr.stall_id
    LEFT JOIN profiles rp ON rp.id = cr.requested_by
    LEFT JOIN profiles ap ON ap.id = cr.assigned_to
    ORDER BY cr.created_at DESC
  `);
  const filesMap = await getCheckRequestFilesMap(rows.map((row) => row.id));
  return rows.map((row) => mapCheckRequestRow(row, filesMap));
}

async function listViolationRequestsInternal() {
  const { rows } = await db.query(`
    SELECT
      vr.id, vr.stall_id, vr.requested_by, vr.reason, vr.status, vr.assigned_officer_id,
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
      vr.id, vr.stall_id, vr.requested_by, vr.assigned_officer_id, vr.reason, vr.status,
      vr.created_at, vr.completed_at
    FROM violation_requests vr
    LEFT JOIN check_requests cr ON cr.id = vr.id
    WHERE cr.id IS NULL
  `);

  for (const row of rows) {
    await db.query(
      "INSERT INTO check_requests (id, stall_id, requested_by, assigned_to, priority, reason, notes, status, created_at, completed_at, completion_notes, completion_summary) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [
        row.id,
        row.stall_id,
        row.requested_by,
        row.assigned_officer_id,
        "normal",
        row.reason,
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
    `SELECT violation_id, file_name, mime_type, file_size FROM violation_evidence WHERE violation_id IN (${placeholders}) ORDER BY created_at ASC`,
    violationIds
  );
  const evidenceMap = new Map();
  for (const row of rows) {
    const existing = evidenceMap.get(row.violation_id) || [];
    existing.push({
      name: row.file_name,
      type: mapCompletionFileType(row.mime_type),
      size: formatBytes(row.file_size),
    });
    evidenceMap.set(row.violation_id, existing);
  }
  return evidenceMap;
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
  };
}

async function listViolationsInternal() {
  const { rows } = await db.query(`
    SELECT
      v.id, v.stall_id, v.vendor_id, v.officer_id, v.category, v.description, v.status, v.remarks, v.created_at, v.resolved_at,
      s.stall_name,
      vp.name AS vendor_name,
      op.name AS officer_name
    FROM violations v
    LEFT JOIN stalls s ON s.id = v.stall_id
    LEFT JOIN profiles vp ON vp.id = v.vendor_id
    LEFT JOIN profiles op ON op.id = v.officer_id
    ORDER BY v.created_at DESC
  `);
  const evidenceMap = await getViolationEvidenceMap(rows.map((row) => row.id));
  return rows.map((row) => mapViolationRow(row, evidenceMap));
}

async function listTerminationRequestsInternal() {
  const { rows } = await db.query(`
    SELECT
      tr.id, tr.type, tr.vendor_id, tr.stall_id, tr.reason, tr.status, tr.created_at, tr.resolved_at,
      vp.name AS vendor_name,
      vp.email AS vendor_email,
      s.stall_name
    FROM termination_requests tr
    LEFT JOIN profiles vp ON vp.id = tr.vendor_id
    LEFT JOIN stalls s ON s.id = tr.stall_id
    ORDER BY tr.created_at DESC
  `);
  return rows.map(mapTerminationRequestRow);
}

function mapApplicationRow(r) {
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
    permitFileName: r.permit_path ? r.permit_path.split("/").pop() : null,
    permitFileSize: null,
    additionalFileName: r.additional_file_path ? r.additional_file_path.split("/").pop() : null,
    additionalFileSize: null,
    notes: r.notes || "",
    status: r.status,
    adminRemarks: r.admin_remarks || "",
    dateApplied: r.date_applied,
    permitDeadlineAt: permitMeta.permitDeadlineAt,
    permitDeadlineUpdatedAt: permitMeta.permitDeadlineUpdatedAt,
    permitTerminatedAt: permitMeta.permitTerminatedAt,
  };
}

async function autoTerminateExpiredPermitDeadlines() {
  const { rows } = await db.query("SELECT id, permit_path, status, admin_remarks FROM applications WHERE status = 'approved'");
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
  }
}

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM profiles WHERE email = $1 LIMIT 1", [String(req.body.email || "").toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.password_hash))) return res.status(401).json({ message: "Invalid email or password." });
    const result = profile(user); setSession(res, result); res.json({ profile: result });
  } catch (error) { next(error); }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password || !phone || !address || String(password).length < 6) return res.status(400).json({ message: "Complete all fields and use a password with at least 6 characters." });
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await db.query("INSERT INTO profiles (id, email, password_hash, name, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6, 'vendor')", [id, String(email).toLowerCase(), passwordHash, name, phone, address]);
    const result = { id, email: String(email).toLowerCase(), name, phone, address, role: "vendor" }; setSession(res, result); res.status(201).json({ profile: result });
  } catch (error) { if (error?.code === "23505") return res.status(409).json({ message: "This email is already in use." }); next(error); }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try { const { rows } = await db.query("SELECT id, email, name, role, address, phone, department FROM profiles WHERE id = $1", [req.auth.sub]); if (!rows[0]) return res.status(401).json({ message: "Account not found." }); res.json({ profile: profile(rows[0]) }); } catch (error) { next(error); }
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

app.get("/api/users", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const role = String(req.query.role || "").trim();
    const values = [];
    let sql = "SELECT id, email, name, role, address, phone, department FROM profiles";
    if (role) {
      values.push(role);
      sql += ` WHERE role = $${values.length}`;
    }
    sql += " ORDER BY name ASC";
    const { rows } = await db.query(sql, values);
    res.json({ users: rows.map(profile) });
  } catch (error) { next(error); }
});

app.get("/api/announcements", requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT a.id, a.title, a.message, a.type, a.author_id, a.created_at, p.name AS author_name
      FROM announcements a
      LEFT JOIN profiles p ON p.id = a.author_id
      ORDER BY a.created_at DESC
    `);
    res.json({ announcements: rows.map(mapAnnouncementRow) });
  } catch (error) { next(error); }
});

app.post("/api/announcements", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const message = String(req.body.message || "").trim();
    const type = String(req.body.type || "info");
    if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
    if (!["info", "warning", "urgent", "success"].includes(type)) return res.status(400).json({ message: "Invalid announcement type." });

    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO announcements (id, title, message, type, author_id) VALUES ($1, $2, $3, $4, $5)",
      [id, title, message, type, req.auth.sub]
    );
    const { rows } = await db.query(
      `SELECT a.id, a.title, a.message, a.type, a.author_id, a.created_at, p.name AS author_name
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

app.get("/api/check-requests", requireAuth, requireRole("admin", "super_admin", "officer"), async (_req, res, next) => {
  try {
    await syncViolationRequestsToCheckRequests();
    res.json({ requests: await listCheckRequestsInternal() });
  } catch (error) { next(error); }
});

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
    if (!stallId || !reason) return res.status(400).json({ message: "Stall and reason are required." });
    if (!["low", "normal", "high", "urgent"].includes(priority)) return res.status(400).json({ message: "Invalid priority." });
    if (!["pending", "completed", "cancelled"].includes(status)) return res.status(400).json({ message: "Invalid status." });

    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO check_requests (id, stall_id, requested_by, assigned_to, priority, reason, notes, status, created_at, completed_at, completion_notes, completion_summary) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [id, stallId, requestedBy, assignedTo, priority, reason, notes || null, status, createdAt, completedAt, completionNotes, completionSummary]
    );
    if (Array.isArray(req.body.completionFiles)) {
      for (const file of req.body.completionFiles) {
        await db.query(
          "INSERT INTO check_request_files (id, check_request_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [
            crypto.randomUUID(),
            id,
            `virtual://check-requests/${id}/${String(file.name || "attachment")}`,
            String(file.name || "attachment"),
            mapCompletionMimeType(file.type),
            parseDisplaySizeToBytes(file.size),
            req.auth.sub,
          ]
        );
      }
    }
    res.status(201).json({ request: (await listCheckRequestsInternal()).find((item) => item.id === id) });
  } catch (error) { next(error); }
});

app.patch("/api/check-requests/:id", requireAuth, requireRole("admin", "super_admin", "officer"), async (req, res, next) => {
  try {
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
    if (updates.length > 0) {
      values.push(req.params.id);
      await db.query(`UPDATE check_requests SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
    }

    if (Array.isArray(req.body.completionFiles)) {
      await db.query("DELETE FROM check_request_files WHERE check_request_id = $1", [req.params.id]);
      for (const file of req.body.completionFiles) {
        await db.query(
          "INSERT INTO check_request_files (id, check_request_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [
            crypto.randomUUID(),
            req.params.id,
            `virtual://check-requests/${req.params.id}/${String(file.name || "attachment")}`,
            String(file.name || "attachment"),
            mapCompletionMimeType(file.type),
            parseDisplaySizeToBytes(file.size),
            req.auth.sub,
          ]
        );
      }
    }

    const updated = (await listCheckRequestsInternal()).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Check request not found." });
    res.json({ request: updated });
  } catch (error) { next(error); }
});

app.delete("/api/check-requests/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    await db.query("DELETE FROM check_requests WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/violation-requests", requireAuth, requireRole("admin", "super_admin", "officer"), async (_req, res, next) => {
  try {
    await syncViolationRequestsToCheckRequests();
    res.json({ requests: await listViolationRequestsInternal() });
  } catch (error) { next(error); }
});

app.post("/api/violation-requests", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const stallId = String(req.body.stallId || "").trim();
    const reason = String(req.body.reason || "").trim();
    const requestedBy = req.body.requestedBy ? String(req.body.requestedBy).trim() : req.auth.sub;
    const assignedOfficerId = req.body.assignedOfficerId ? String(req.body.assignedOfficerId).trim() : null;
    const status = String(req.body.status || (assignedOfficerId ? "assigned" : "pending"));
    const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : new Date();
    const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : (status === "completed" ? new Date() : null);
    if (!stallId || !reason) return res.status(400).json({ message: "Stall and reason are required." });
    if (!["pending", "assigned", "completed"].includes(status)) return res.status(400).json({ message: "Invalid status." });

    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO violation_requests (id, stall_id, requested_by, reason, status, assigned_officer_id, created_at, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, stallId, requestedBy, reason, status, assignedOfficerId, createdAt, completedAt]
    );
    await db.query(
      "INSERT INTO check_requests (id, stall_id, requested_by, assigned_to, priority, reason, notes, status, created_at, completed_at, completion_notes, completion_summary) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [
        id,
        stallId,
        requestedBy,
        assignedOfficerId,
        "normal",
        reason,
        "Generated from violation request.",
        status === "completed" ? "completed" : "pending",
        createdAt,
        status === "completed" ? completedAt || new Date() : null,
        "",
        "",
      ]
    );
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

    values.push(req.params.id);
    await db.query(`UPDATE violation_requests SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
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
    if (mirroredUpdates.length > 0) {
      mirroredValues.push(req.params.id);
      await db.query(`UPDATE check_requests SET ${mirroredUpdates.join(", ")} WHERE id = $${mirroredValues.length}`, mirroredValues);
    }
    const updated = (await listViolationRequestsInternal()).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Violation request not found." });
    res.json({ request: updated });
  } catch (error) { next(error); }
});

app.get("/api/violations", requireAuth, requireRole("admin", "super_admin", "officer", "vendor"), async (_req, res, next) => {
  try {
    res.json({ violations: await listViolationsInternal() });
  } catch (error) { next(error); }
});

app.post("/api/violations", requireAuth, requireRole("admin", "super_admin", "officer", "vendor"), async (req, res, next) => {
  try {
    const stallId = String(req.body.stallId || "").trim();
    const vendorId = req.body.vendorId ? String(req.body.vendorId).trim() : null;
    const officerId = req.body.officerId ? String(req.body.officerId).trim() : (req.auth.role === "officer" ? req.auth.sub : "44444444-4444-4444-8444-444444444444");
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();
    const status = String(req.body.status || "open");
    const remarks = String(req.body.remarks || "").trim();
    const evidence = Array.isArray(req.body.evidence) ? req.body.evidence : [];
    const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : new Date();
    const resolvedAt = req.body.resolvedAt ? new Date(req.body.resolvedAt) : (status === "open" ? null : new Date());
    if (!stallId || !category || !description) return res.status(400).json({ message: "Stall, category, and description are required." });

    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO violations (id, stall_id, vendor_id, officer_id, category, description, status, remarks, created_at, resolved_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [id, stallId, vendorId, officerId, category, description, status, remarks || null, createdAt, resolvedAt]
    );
    for (const file of evidence) {
      await db.query(
        "INSERT INTO violation_evidence (id, violation_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          crypto.randomUUID(),
          id,
          `virtual://violations/${id}/${String(file.name || "attachment")}`,
          String(file.name || "attachment"),
          mapCompletionMimeType(file.type),
          parseDisplaySizeToBytes(file.size),
          req.auth.sub,
        ]
      );
    }
    res.status(201).json({ violation: (await listViolationsInternal()).find((item) => item.id === id) });
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
      values.push(String(req.body.status));
      updates.push(`status = $${values.length}`);
      values.push(req.body.status === "open" ? null : new Date());
      updates.push(`resolved_at = $${values.length}`);
    }
    if (req.body.remarks !== undefined) { values.push(String(req.body.remarks || "").trim()); updates.push(`remarks = $${values.length}`); }
    if (updates.length > 0) {
      values.push(req.params.id);
      await db.query(`UPDATE violations SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
    }
    if (Array.isArray(req.body.evidence) && req.body.evidence.length > 0) {
      for (const file of req.body.evidence) {
        await db.query(
          "INSERT INTO violation_evidence (id, violation_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [
            crypto.randomUUID(),
            req.params.id,
            `virtual://violations/${req.params.id}/${String(file.name || "attachment")}`,
            String(file.name || "attachment"),
            mapCompletionMimeType(file.type),
            parseDisplaySizeToBytes(file.size),
            req.auth.sub,
          ]
        );
      }
    }
    const updated = (await listViolationsInternal()).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Violation not found." });
    res.json({ violation: updated });
  } catch (error) { next(error); }
});

app.get("/api/termination-requests", requireAuth, requireRole("admin", "super_admin", "vendor"), async (_req, res, next) => {
  try {
    res.json({ requests: await listTerminationRequestsInternal() });
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

app.patch("/api/termination-requests/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const status = String(req.body.status || "").trim();
    if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status." });
    await db.query(
      "UPDATE termination_requests SET status = $1, resolved_at = $2 WHERE id = $3",
      [status, status === "pending" ? null : new Date(), req.params.id]
    );
    const updated = (await listTerminationRequestsInternal()).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Termination request not found." });
    res.json({ request: updated });
  } catch (error) { next(error); }
});

app.get("/api/stalls", async (req, res, next) => {
  try { const { rows } = await db.query("SELECT id, stall_name, status, business_type, section, floor, floor_area, notes, geometry, created_at FROM stalls ORDER BY created_at DESC"); res.json({ stalls: rows.map(r => ({ ...r, geometry: typeof r.geometry === "string" ? JSON.parse(r.geometry) : r.geometry })) }); } catch (error) { next(error); }
});

app.post("/api/stalls", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stall_name, business_type, section, floor, floor_area, notes, geometry } = req.body;
    if (!stall_name || !business_type || !section || !floor || !floor_area) return res.status(400).json({ message: "Missing required fields." });
    const id = crypto.randomUUID();
    await db.query("INSERT INTO stalls (id, stall_name, status, business_type, section, floor, floor_area, notes, geometry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [id, stall_name, "vacant", business_type, section, floor, floor_area || "", notes || "", JSON.stringify(geometry)]);
    res.status(201).json({ stall: { id, stall_name, status: "vacant", owner_id: null, business_type, section, floor, floor_area, notes, geometry, created_at: new Date().toISOString() } });
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
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });
    values.push(req.params.id);
    await db.query(`UPDATE stalls SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
    const { rows } = await db.query("SELECT id, stall_name, status, owner_id, business_type, section, floor, floor_area, notes, geometry, created_at FROM stalls WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Stall not found." });
    const row = rows[0]; res.json({ stall: { ...row, geometry: typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry } });
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

async function cascadeDeleteStall(conn, id) {
  await conn.query("DELETE FROM check_requests WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM violation_requests WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM violations WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM transfers WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM termination_requests WHERE stall_id = $1", [id]);
  await conn.query("DELETE FROM applications WHERE stall_id = $1", [id]);
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
      for (const id of ids) { await cascadeDeleteStall(conn, id); }
      await conn.query("COMMIT"); res.json({ ok: true });
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
      await cascadeDeleteStall(conn, req.params.id);
      await conn.query("COMMIT"); res.json({ ok: true });
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.post("/api/stalls/import", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stalls } = req.body;
    if (!Array.isArray(stalls)) return res.status(400).json({ message: "Stalls array is required." });
    const conn = await db.connect();
    const idMap = {};
    try { await conn.query("BEGIN");
      for (const stall of stalls) { const newId = crypto.randomUUID(); idMap[stall.id] = newId; await conn.query("INSERT INTO stalls (id, stall_name, status, business_type, section, floor, floor_area, notes, geometry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [newId, stall.stall_name, stall.status, stall.business_type, stall.section, stall.floor || "1", stall.floor_area, stall.notes || "", JSON.stringify(stall.geometry)]); }
      await conn.query("COMMIT"); res.status(201).json({ ok: true, idMap });
    } catch (innerError) { await conn.query("ROLLBACK"); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.get("/api/applications", async (req, res, next) => {
  try {
    await autoTerminateExpiredPermitDeadlines();
    const { rows } = await db.query(`
      SELECT
        a.id, a.user_id, a.stall_id, a.business_name, a.business_type,
        a.contract_start, a.contract_term_months, a.contract_end, a.permit_path, a.additional_file_path,
        a.notes, a.status, a.admin_remarks, a.date_applied,
        s.stall_name, s.section, s.floor_area,
        p.name as applicant_name, p.email as applicant_email, p.address as applicant_address
      FROM applications a
      LEFT JOIN stalls s ON a.stall_id = s.id
      LEFT JOIN profiles p ON a.user_id = p.id
      ORDER BY a.date_applied DESC
    `);
    const applications = rows.map(mapApplicationRow);
    res.json({ applications });
  } catch (error) { next(error); }
});

app.post("/api/applications", requireAuth, requireRole("vendor"), async (req, res, next) => {
  try {
    const { stallId, businessName, businessType, contractStart, contractTermMonths, contractEnd, permitPath, additionalFilePath, notes } = req.body;
    if (!stallId || !businessName || !businessType || !contractStart || !contractTermMonths || !contractEnd) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO applications (id, user_id, stall_id, business_name, business_type, contract_start, contract_term_months, contract_end, permit_path, additional_file_path, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [id, req.auth.sub, stallId, businessName, businessType, contractStart, parseInt(contractTermMonths), contractEnd, permitPath || null, additionalFilePath || null, notes || ""]
    );
    const { rows } = await db.query(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = $1`,
      [id]
    );
    const app = mapApplicationRow(rows[0]);
    res.status(201).json({ application: app });
  } catch (error) { next(error); }
});

app.patch("/api/applications/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    const updates = []; const values = [];
    if (status !== undefined) { values.push(status); updates.push(`status = $${values.length}`); }
    if (adminRemarks !== undefined) { values.push(adminRemarks); updates.push(`admin_remarks = $${values.length}`); }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });
    values.push(req.params.id);
    await db.query(`UPDATE applications SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
    const { rows } = await db.query(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Application not found." });
    const app = mapApplicationRow(rows[0]);
    res.json({ application: app });
  } catch (error) { next(error); }
});

app.patch("/api/applications/:id/permit", requireAuth, async (req, res, next) => {
  try {
    const { permitFileName } = req.body;
    if (!permitFileName) return res.status(400).json({ message: "Permit file name is required." });

    const { rows: existingRows } = await db.query(
      "SELECT id, user_id, admin_remarks FROM applications WHERE id = $1",
      [req.params.id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ message: "Application not found." });
    if (req.auth.role === "vendor" && existing.user_id !== req.auth.sub) {
      return res.status(403).json({ message: "Access denied." });
    }

    const meta = parsePermitMeta(existing.admin_remarks || "");
    await db.query(
      "UPDATE applications SET permit_path = $1, admin_remarks = $2 WHERE id = $3",
      [permitFileName, buildPermitMetaRemarks(meta.visibleRemarks, {}), req.params.id]
    );

    const { rows } = await db.query(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Application not found." });
    res.json({ application: mapApplicationRow(rows[0]) });
  } catch (error) { next(error); }
});

app.delete("/api/applications/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try { await db.query("DELETE FROM applications WHERE id = $1", [req.params.id]); res.json({ ok: true }); } catch (error) { next(error); }
});

// ── Market Perimeters (multi-zone) ────────────────────────────────────────────
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
    res.json({ perimeters });
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

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: "Unexpected server error." }); });
app.listen(port, () => console.log(`PubMark API listening on ${port}`));

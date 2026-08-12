import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is required.");
const db = mysql.createPool({ host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306), database: process.env.MYSQL_DATABASE, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, waitForConnections: true, connectionLimit: 10 });
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

const DEFAULT_ANNOUNCEMENTS = [
  {
    title: "Welcome to Stall Management Portal",
    message: "All stall applicants are reminded to submit complete documentation including business permit and valid ID. Incomplete applications will not be processed.",
    type: "info",
  },
  {
    title: "Deadline Reminder: May 15 Applications",
    message: "Applications for Stalls A-101 to A-110 are due by May 15, 2026. Please ensure all required documents are uploaded before the deadline.",
    type: "warning",
  },
  {
    title: "New Stalls Available in Section B",
    message: "We are pleased to announce that 8 new stalls in Section B are now open for applications. Visit the map to view their locations and submit your application.",
    type: "success",
  },
];
const DEFAULT_ANNOUNCEMENT_AUTHOR_ID = "22222222-2222-4222-8222-222222222222";

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

async function ensureDefaultAnnouncements() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id CHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info','warning','urgent','success') NOT NULL DEFAULT 'info',
      author_id CHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES profiles(id)
    )
  `);
  const [countRows] = await db.execute("SELECT COUNT(*) AS count FROM announcements");
  if (Number(countRows[0]?.count || 0) > 0) return;

  const [adminRows] = await db.execute(
    "SELECT id FROM profiles WHERE id = ? OR role IN ('admin', 'super_admin') ORDER BY role = 'admin' DESC, created_at ASC LIMIT 1",
    [DEFAULT_ANNOUNCEMENT_AUTHOR_ID]
  );
  const authorId = adminRows[0]?.id;
  if (!authorId) return;

  for (const item of DEFAULT_ANNOUNCEMENTS) {
    await db.execute(
      "INSERT INTO announcements (id, title, message, type, author_id) VALUES (?, ?, ?, ?, ?)",
      [crypto.randomUUID(), item.title, item.message, item.type, authorId]
    );
  }
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

async function ensureRequestTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS violation_requests (
      id CHAR(36) PRIMARY KEY,
      stall_id CHAR(36) NOT NULL,
      requested_by CHAR(36) NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending','assigned','completed') NOT NULL DEFAULT 'pending',
      assigned_officer_id CHAR(36) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      FOREIGN KEY (stall_id) REFERENCES stalls(id),
      FOREIGN KEY (requested_by) REFERENCES profiles(id),
      FOREIGN KEY (assigned_officer_id) REFERENCES profiles(id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS check_requests (
      id CHAR(36) PRIMARY KEY,
      stall_id CHAR(36) NOT NULL,
      requested_by CHAR(36) NOT NULL,
      assigned_to CHAR(36) NULL,
      priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
      reason TEXT NOT NULL,
      notes TEXT NULL,
      status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      completion_notes TEXT NULL,
      completion_summary TEXT NULL,
      FOREIGN KEY (stall_id) REFERENCES stalls(id),
      FOREIGN KEY (requested_by) REFERENCES profiles(id),
      FOREIGN KEY (assigned_to) REFERENCES profiles(id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS check_request_files (
      id CHAR(36) PRIMARY KEY,
      check_request_id CHAR(36) NOT NULL,
      storage_path VARCHAR(1024) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      uploaded_by CHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (check_request_id) REFERENCES check_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES profiles(id)
    )
  `);
}

async function getCheckRequestFilesMap(requestIds) {
  if (requestIds.length === 0) return new Map();
  const placeholders = requestIds.map(() => "?").join(", ");
  const [rows] = await db.execute(
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
  await ensureRequestTables();
  const [rows] = await db.execute(`
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
  await ensureRequestTables();
  const [rows] = await db.execute(`
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
  await ensureRequestTables();
  const [rows] = await db.execute(`
    SELECT
      vr.id, vr.stall_id, vr.requested_by, vr.assigned_officer_id, vr.reason, vr.status,
      vr.created_at, vr.completed_at
    FROM violation_requests vr
    LEFT JOIN check_requests cr ON cr.id = vr.id
    WHERE cr.id IS NULL
  `);

  for (const row of rows) {
    await db.execute(
      "INSERT INTO check_requests (id, stall_id, requested_by, assigned_to, priority, reason, notes, status, created_at, completed_at, completion_notes, completion_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

async function ensureViolationAndTerminationTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS termination_requests (
      id CHAR(36) PRIMARY KEY,
      type ENUM('account','contract') NOT NULL,
      vendor_id CHAR(36) NOT NULL,
      stall_id CHAR(36) NULL,
      reason TEXT NOT NULL,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      FOREIGN KEY (vendor_id) REFERENCES profiles(id),
      FOREIGN KEY (stall_id) REFERENCES stalls(id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS violations (
      id CHAR(36) PRIMARY KEY,
      stall_id CHAR(36) NOT NULL,
      vendor_id CHAR(36) NULL,
      officer_id CHAR(36) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      status ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
      remarks TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      FOREIGN KEY (stall_id) REFERENCES stalls(id),
      FOREIGN KEY (vendor_id) REFERENCES profiles(id),
      FOREIGN KEY (officer_id) REFERENCES profiles(id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS violation_evidence (
      id CHAR(36) PRIMARY KEY,
      violation_id CHAR(36) NOT NULL,
      storage_path VARCHAR(1024) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      uploaded_by CHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES profiles(id)
    )
  `);
}

async function getViolationEvidenceMap(violationIds) {
  if (violationIds.length === 0) return new Map();
  const placeholders = violationIds.map(() => "?").join(", ");
  const [rows] = await db.execute(
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
  await ensureViolationAndTerminationTables();
  const [rows] = await db.execute(`
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
  await ensureViolationAndTerminationTables();
  const [rows] = await db.execute(`
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
  const [rows] = await db.execute("SELECT id, permit_path, status, admin_remarks FROM applications WHERE status = 'approved'");
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

    await db.execute(
      "UPDATE applications SET status = 'rejected', admin_remarks = ? WHERE id = ?",
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
    const [rows] = await db.execute("SELECT * FROM profiles WHERE email = ? LIMIT 1", [String(req.body.email || "").toLowerCase()]);
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
    await db.execute("INSERT INTO profiles (id, email, password_hash, name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, 'vendor')", [id, String(email).toLowerCase(), passwordHash, name, phone, address]);
    const result = { id, email: String(email).toLowerCase(), name, phone, address, role: "vendor" }; setSession(res, result); res.status(201).json({ profile: result });
  } catch (error) { if (error?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "This email is already in use." }); next(error); }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try { const [rows] = await db.execute("SELECT id, email, name, role, address, phone, department FROM profiles WHERE id = ?", [req.auth.sub]); if (!rows[0]) return res.status(401).json({ message: "Account not found." }); res.json({ profile: profile(rows[0]) }); } catch (error) { next(error); }
});
app.get("/api/auth/users/by-email", requireAuth, async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required." });
    const [rows] = await db.execute(
      "SELECT id, email, name, role, address, phone, department FROM profiles WHERE email = ? LIMIT 1",
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
      sql += " WHERE role = ?";
      values.push(role);
    }
    sql += " ORDER BY name ASC";
    const [rows] = await db.execute(sql, values);
    res.json({ users: rows.map(profile) });
  } catch (error) { next(error); }
});

app.get("/api/announcements", requireAuth, async (_req, res, next) => {
  try {
    await ensureDefaultAnnouncements();
    const [rows] = await db.execute(`
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
    await db.execute(
      "INSERT INTO announcements (id, title, message, type, author_id) VALUES (?, ?, ?, ?, ?)",
      [id, title, message, type, req.auth.sub]
    );
    const [rows] = await db.execute(
      `SELECT a.id, a.title, a.message, a.type, a.author_id, a.created_at, p.name AS author_name
       FROM announcements a
       LEFT JOIN profiles p ON p.id = a.author_id
       WHERE a.id = ?
       LIMIT 1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Announcement not found after creation." });
    res.status(201).json({ announcement: mapAnnouncementRow(rows[0]) });
  } catch (error) { next(error); }
});

app.delete("/api/announcements/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    await db.execute("DELETE FROM announcements WHERE id = ?", [req.params.id]);
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
    await ensureRequestTables();
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
    await db.execute(
      "INSERT INTO check_requests (id, stall_id, requested_by, assigned_to, priority, reason, notes, status, created_at, completed_at, completion_notes, completion_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, stallId, requestedBy, assignedTo, priority, reason, notes || null, status, createdAt, completedAt, completionNotes, completionSummary]
    );
    if (Array.isArray(req.body.completionFiles)) {
      for (const file of req.body.completionFiles) {
        await db.execute(
          "INSERT INTO check_request_files (id, check_request_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
    await ensureRequestTables();
    const updates = [];
    const values = [];
    if (req.body.assignedTo !== undefined) { updates.push("assigned_to = ?"); values.push(req.body.assignedTo ? String(req.body.assignedTo).trim() : null); }
    if (req.body.priority !== undefined) { updates.push("priority = ?"); values.push(String(req.body.priority)); }
    if (req.body.reason !== undefined) { updates.push("reason = ?"); values.push(String(req.body.reason).trim()); }
    if (req.body.notes !== undefined) { updates.push("notes = ?"); values.push(String(req.body.notes || "").trim() || null); }
    if (req.body.status !== undefined) {
      updates.push("status = ?");
      values.push(String(req.body.status));
      updates.push("completed_at = ?");
      values.push(req.body.status === "pending" ? null : new Date());
    }
    if (req.body.completionNotes !== undefined) { updates.push("completion_notes = ?"); values.push(String(req.body.completionNotes || "")); }
    if (req.body.completionSummary !== undefined) { updates.push("completion_summary = ?"); values.push(String(req.body.completionSummary || "")); }
    if (updates.length > 0) {
      values.push(req.params.id);
      await db.execute(`UPDATE check_requests SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    if (Array.isArray(req.body.completionFiles)) {
      await db.execute("DELETE FROM check_request_files WHERE check_request_id = ?", [req.params.id]);
      for (const file of req.body.completionFiles) {
        await db.execute(
          "INSERT INTO check_request_files (id, check_request_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
    await ensureRequestTables();
    await db.execute("DELETE FROM check_requests WHERE id = ?", [req.params.id]);
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
    await ensureRequestTables();
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
    await db.execute(
      "INSERT INTO violation_requests (id, stall_id, requested_by, reason, status, assigned_officer_id, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, stallId, requestedBy, reason, status, assignedOfficerId, createdAt, completedAt]
    );
    await db.execute(
      "INSERT INTO check_requests (id, stall_id, requested_by, assigned_to, priority, reason, notes, status, created_at, completed_at, completion_notes, completion_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    await ensureRequestTables();
    const updates = [];
    const values = [];
    if (req.body.reason !== undefined) { updates.push("reason = ?"); values.push(String(req.body.reason || "").trim()); }
    if (req.body.assignedOfficerId !== undefined) {
      updates.push("assigned_officer_id = ?");
      values.push(req.body.assignedOfficerId ? String(req.body.assignedOfficerId).trim() : null);
      if (req.body.status === undefined) {
        updates.push("status = ?");
        values.push(req.body.assignedOfficerId ? "assigned" : "pending");
      }
    }
    if (req.body.status !== undefined) {
      updates.push("status = ?");
      values.push(String(req.body.status));
      updates.push("completed_at = ?");
      values.push(req.body.status === "completed" ? new Date() : null);
    }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });

    values.push(req.params.id);
    await db.execute(`UPDATE violation_requests SET ${updates.join(", ")} WHERE id = ?`, values);
    const mirroredUpdates = [];
    const mirroredValues = [];
    if (req.body.reason !== undefined) {
      mirroredUpdates.push("reason = ?");
      mirroredValues.push(String(req.body.reason || "").trim());
    }
    if (req.body.assignedOfficerId !== undefined) {
      mirroredUpdates.push("assigned_to = ?");
      mirroredValues.push(req.body.assignedOfficerId ? String(req.body.assignedOfficerId).trim() : null);
    }
    if (req.body.status !== undefined) {
      mirroredUpdates.push("status = ?");
      mirroredValues.push(req.body.status === "completed" ? "completed" : "pending");
      mirroredUpdates.push("completed_at = ?");
      mirroredValues.push(req.body.status === "completed" ? new Date() : null);
    } else if (req.body.assignedOfficerId !== undefined) {
      mirroredUpdates.push("status = ?");
      mirroredValues.push(req.body.assignedOfficerId ? "pending" : "pending");
    }
    if (mirroredUpdates.length > 0) {
      mirroredValues.push(req.params.id);
      await db.execute(`UPDATE check_requests SET ${mirroredUpdates.join(", ")} WHERE id = ?`, mirroredValues);
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
    await ensureViolationAndTerminationTables();
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
    await db.execute(
      "INSERT INTO violations (id, stall_id, vendor_id, officer_id, category, description, status, remarks, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, stallId, vendorId, officerId, category, description, status, remarks || null, createdAt, resolvedAt]
    );
    for (const file of evidence) {
      await db.execute(
        "INSERT INTO violation_evidence (id, violation_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
    await ensureViolationAndTerminationTables();
    const updates = [];
    const values = [];
    if (req.body.officerId !== undefined) { updates.push("officer_id = ?"); values.push(String(req.body.officerId || "").trim()); }
    if (req.body.category !== undefined) { updates.push("category = ?"); values.push(String(req.body.category || "").trim()); }
    if (req.body.description !== undefined) { updates.push("description = ?"); values.push(String(req.body.description || "").trim()); }
    if (req.body.status !== undefined) {
      updates.push("status = ?");
      values.push(String(req.body.status));
      updates.push("resolved_at = ?");
      values.push(req.body.status === "open" ? null : new Date());
    }
    if (req.body.remarks !== undefined) { updates.push("remarks = ?"); values.push(String(req.body.remarks || "").trim()); }
    if (updates.length > 0) {
      values.push(req.params.id);
      await db.execute(`UPDATE violations SET ${updates.join(", ")} WHERE id = ?`, values);
    }
    if (Array.isArray(req.body.evidence) && req.body.evidence.length > 0) {
      for (const file of req.body.evidence) {
        await db.execute(
          "INSERT INTO violation_evidence (id, violation_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
    await ensureViolationAndTerminationTables();
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
    await db.execute(
      "INSERT INTO termination_requests (id, type, vendor_id, stall_id, reason, status, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, type, vendorId, stallId, reason, status, createdAt, resolvedAt]
    );
    res.status(201).json({ request: (await listTerminationRequestsInternal()).find((item) => item.id === id) });
  } catch (error) { next(error); }
});

app.patch("/api/termination-requests/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    await ensureViolationAndTerminationTables();
    const status = String(req.body.status || "").trim();
    if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status." });
    await db.execute(
      "UPDATE termination_requests SET status = ?, resolved_at = ? WHERE id = ?",
      [status, status === "pending" ? null : new Date(), req.params.id]
    );
    const updated = (await listTerminationRequestsInternal()).find((item) => item.id === req.params.id);
    if (!updated) return res.status(404).json({ message: "Termination request not found." });
    res.json({ request: updated });
  } catch (error) { next(error); }
});

app.get("/api/stalls", async (req, res, next) => {
  try { const [rows] = await db.execute("SELECT id, stall_name, status, business_type, section, floor, floor_area, notes, geometry, created_at FROM stalls ORDER BY created_at DESC"); res.json({ stalls: rows.map(r => ({ ...r, geometry: typeof r.geometry === "string" ? JSON.parse(r.geometry) : r.geometry })) }); } catch (error) { next(error); }
});

app.post("/api/stalls", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stall_name, business_type, section, floor, floor_area, notes, geometry } = req.body;
    if (!stall_name || !business_type || !section || !floor || !floor_area) return res.status(400).json({ message: "Missing required fields." });
    const id = crypto.randomUUID();
    await db.execute("INSERT INTO stalls (id, stall_name, status, business_type, section, floor, floor_area, notes, geometry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, stall_name, "vacant", business_type, section, floor, floor_area || "", notes || "", JSON.stringify(geometry)]);
    res.status(201).json({ stall: { id, stall_name, status: "vacant", owner_id: null, business_type, section, floor, floor_area, notes, geometry, created_at: new Date().toISOString() } });
  } catch (error) { next(error); }
});

app.patch("/api/stalls/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stall_name, business_type, section, floor, floor_area, notes, status } = req.body;
    const updates = []; const values = [];
    if (stall_name !== undefined) { updates.push("stall_name = ?"); values.push(stall_name); }
    if (business_type !== undefined) { updates.push("business_type = ?"); values.push(business_type); }
    if (section !== undefined) { updates.push("section = ?"); values.push(section); }
    if (floor !== undefined) { updates.push("floor = ?"); values.push(floor); }
    if (floor_area !== undefined) { updates.push("floor_area = ?"); values.push(floor_area); }
    if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });
    values.push(req.params.id);
    await db.execute(`UPDATE stalls SET ${updates.join(", ")} WHERE id = ?`, values);
    const [rows] = await db.execute("SELECT id, stall_name, status, owner_id, business_type, section, floor, floor_area, notes, geometry, created_at FROM stalls WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Stall not found." });
    const row = rows[0]; res.json({ stall: { ...row, geometry: typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry } });
  } catch (error) { next(error); }
});

app.patch("/api/stalls/geometry", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) return res.status(400).json({ message: "Updates array is required and must not be empty." });
    const conn = await db.getConnection();
    try { await conn.beginTransaction();
      for (const { id, geometry } of updates) { await conn.execute("UPDATE stalls SET geometry = ? WHERE id = ?", [JSON.stringify(geometry), id]); }
      await conn.commit(); res.json({ ok: true });
    } catch (innerError) { await conn.rollback(); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.delete("/api/stalls", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "IDs array is required and must not be empty." });
    const conn = await db.getConnection();
    try { await conn.beginTransaction();
      for (const id of ids) { await conn.execute("DELETE FROM stalls WHERE id = ?", [id]); }
      await conn.commit(); res.json({ ok: true });
    } catch (innerError) { await conn.rollback(); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.delete("/api/stalls/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try { await db.execute("DELETE FROM stalls WHERE id = ?", [req.params.id]); res.json({ ok: true }); } catch (error) { next(error); }
});

app.post("/api/stalls/import", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { stalls } = req.body;
    if (!Array.isArray(stalls)) return res.status(400).json({ message: "Stalls array is required." });
    const conn = await db.getConnection();
    const idMap = {};
    try { await conn.beginTransaction();
      for (const stall of stalls) { const newId = crypto.randomUUID(); idMap[stall.id] = newId; await conn.execute("INSERT INTO stalls (id, stall_name, status, business_type, section, floor, floor_area, notes, geometry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [newId, stall.stall_name, stall.status, stall.business_type, stall.section, stall.floor || "1", stall.floor_area, stall.notes || "", JSON.stringify(stall.geometry)]); }
      await conn.commit(); res.status(201).json({ ok: true, idMap });
    } catch (innerError) { await conn.rollback(); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.get("/api/applications", async (req, res, next) => {
  try {
    await autoTerminateExpiredPermitDeadlines();
    const [rows] = await db.execute(`
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
    await db.execute(
      "INSERT INTO applications (id, user_id, stall_id, business_name, business_type, contract_start, contract_term_months, contract_end, permit_path, additional_file_path, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, req.auth.sub, stallId, businessName, businessType, contractStart, parseInt(contractTermMonths), contractEnd, permitPath || null, additionalFilePath || null, notes || ""]
    );
    const [rows] = await db.execute(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = ?`,
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
    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (adminRemarks !== undefined) { updates.push("admin_remarks = ?"); values.push(adminRemarks); }
    if (updates.length === 0) return res.status(400).json({ message: "No fields to update." });
    values.push(req.params.id);
    await db.execute(`UPDATE applications SET ${updates.join(", ")} WHERE id = ?`, values);
    const [rows] = await db.execute(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = ?`,
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

    const [existingRows] = await db.execute(
      "SELECT id, user_id, admin_remarks FROM applications WHERE id = ?",
      [req.params.id]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ message: "Application not found." });
    if (req.auth.role === "vendor" && existing.user_id !== req.auth.sub) {
      return res.status(403).json({ message: "Access denied." });
    }

    const meta = parsePermitMeta(existing.admin_remarks || "");
    await db.execute(
      "UPDATE applications SET permit_path = ?, admin_remarks = ? WHERE id = ?",
      [permitFileName, buildPermitMetaRemarks(meta.visibleRemarks, {}), req.params.id]
    );

    const [rows] = await db.execute(
      `SELECT a.id, a.user_id, a.stall_id, a.business_name, a.business_type, a.contract_start, a.contract_term_months, a.contract_end, a.permit_path, a.additional_file_path, a.notes, a.status, a.admin_remarks, a.date_applied, s.stall_name, s.section, s.floor_area, p.name, p.email, p.address FROM applications a LEFT JOIN stalls s ON a.stall_id = s.id LEFT JOIN profiles p ON a.user_id = p.id WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Application not found." });
    res.json({ application: mapApplicationRow(rows[0]) });
  } catch (error) { next(error); }
});

app.delete("/api/applications/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try { await db.execute("DELETE FROM applications WHERE id = ?", [req.params.id]); res.json({ ok: true }); } catch (error) { next(error); }
});

// ── Market Perimeter (singleton) ──────────────────────────────────────────────
app.get("/api/perimeter", async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT mp.id, mp.name, mp.geometry, mp.created_by, mp.notes, mp.created_at, p.name AS created_by_name
      FROM market_perimeter mp
      LEFT JOIN profiles p ON mp.created_by = p.id
      ORDER BY mp.created_at DESC LIMIT 1
    `);
    const perimeter = rows[0] ? {
      id: rows[0].id,
      name: rows[0].name,
      geometry: typeof rows[0].geometry === "string" ? JSON.parse(rows[0].geometry) : rows[0].geometry,
      createdBy: rows[0].created_by,
      createdByName: rows[0].created_by_name || "Unknown",
      notes: rows[0].notes || "",
      createdAt: rows[0].created_at,
    } : null;
    res.json({ perimeter });
  } catch (error) { next(error); }
});

app.post("/api/perimeter", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    const { name, geometry, notes } = req.body;
    if (!name || !geometry) return res.status(400).json({ message: "Name and geometry are required." });
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute("DELETE FROM market_perimeter");
      const id = crypto.randomUUID();
      await conn.execute(
        "INSERT INTO market_perimeter (id, name, geometry, created_by, notes) VALUES (?, ?, ?, ?, ?)",
        [id, name, JSON.stringify(geometry), req.auth.sub, notes || ""]
      );
      const [rows] = await conn.execute(`
        SELECT mp.id, mp.name, mp.geometry, mp.created_by, mp.notes, mp.created_at, p.name AS created_by_name
        FROM market_perimeter mp
        LEFT JOIN profiles p ON mp.created_by = p.id
        WHERE mp.id = ?
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
      await conn.commit();
      res.status(201).json({ perimeter });
    } catch (innerError) { await conn.rollback(); throw innerError; }
    finally { conn.release(); }
  } catch (error) { next(error); }
});

app.delete("/api/perimeter", requireAuth, requireRole("super_admin"), async (req, res, next) => {
  try {
    await db.execute("DELETE FROM market_perimeter");
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: "Unexpected server error." }); });
app.listen(port, () => console.log(`PubMark API listening on ${port}`));

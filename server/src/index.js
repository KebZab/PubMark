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
function profile(row) { return { id: row.id, email: row.email, name: row.name, role: row.role, address: row.address, phone: row.phone, department: row.department }; }
function requireRole(...roles) { return (req, res, next) => { if (!roles.includes(req.auth?.role)) return res.status(403).json({ message: "Access denied." }); next(); }; }

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
    const applications = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      stallId: r.stall_id,
      stallName: r.stall_name,
      stallSection: r.section,
      floorArea: r.floor_area,
      applicantName: r.applicant_name,
      applicantEmail: r.applicant_email,
      applicantAddress: r.applicant_address,
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
      dateApplied: r.date_applied
    }));
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
    const r = rows[0];
    const app = {
      id: r.id,
      userId: r.user_id,
      stallId: r.stall_id,
      stallName: r.stall_name,
      stallSection: r.section,
      floorArea: r.floor_area,
      applicantName: r.name,
      applicantEmail: r.email,
      applicantAddress: r.address,
      businessName: r.business_name,
      businessType: r.business_type,
      contractStart: r.contract_start,
      contractTermMonths: r.contract_term_months.toString(),
      contractEnd: r.contract_end,
      permitFileName: null,
      permitFileSize: null,
      additionalFileName: null,
      additionalFileSize: null,
      notes: r.notes || "",
      status: r.status,
      adminRemarks: r.admin_remarks || "",
      dateApplied: r.date_applied
    };
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
    const r = rows[0];
    const app = {
      id: r.id,
      userId: r.user_id,
      stallId: r.stall_id,
      stallName: r.stall_name,
      stallSection: r.section,
      floorArea: r.floor_area,
      applicantName: r.name,
      applicantEmail: r.email,
      applicantAddress: r.address,
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
      dateApplied: r.date_applied
    };
    res.json({ application: app });
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

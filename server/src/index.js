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
app.post("/api/auth/logout", (_req, res) => { res.clearCookie("pubmark_session", cookieOptions()); res.json({ ok: true }); });
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: "Unexpected server error." }); });
app.listen(port, () => console.log(`PubMark API listening on ${port}`));

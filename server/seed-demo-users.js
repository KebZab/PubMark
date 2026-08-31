import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const users = [
  ["11111111-1111-4111-8111-111111111111", "superadmin@pubmark.com", "super123", "Ricardo Magalona", "super_admin", "Executive"],
  ["22222222-2222-4222-8222-222222222222", "admin@pubmark.com", "admin123", "Admin", "admin", "Market Administration"],
  ["33333333-3333-4333-8333-333333333333", "juan@example.com", "user123", "Juan dela Cruz", "vendor", null],
  ["44444444-4444-4444-8444-444444444444", "officer@pubmark.com", "officer123", "Carlos Reyes", "officer", "Market Enforcement"],
];
for (const [id, email, password, name, role, department] of users) {
  await db.query(
    "INSERT INTO profiles (id, email, password_hash, name, role, department) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, department = EXCLUDED.department",
    [id, email, await bcrypt.hash(password, 12), name, role, department]
  );
}
await db.end();
console.log("Demo users seeded.");

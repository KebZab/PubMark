import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const db = await mysql.createConnection({ host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306), database: process.env.MYSQL_DATABASE, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD });
const users = [
  ["11111111-1111-4111-8111-111111111111", "superadmin@pubmark.com", "super123", "Ricardo Magalona", "super_admin", "Executive"],
  ["22222222-2222-4222-8222-222222222222", "admin@pubmark.com", "admin123", "Admin", "admin", "Market Administration"],
  ["33333333-3333-4333-8333-333333333333", "juan@example.com", "user123", "Juan dela Cruz", "vendor", null],
  ["44444444-4444-4444-8444-444444444444", "officer@pubmark.com", "officer123", "Carlos Reyes", "officer", "Market Enforcement"],
];
for (const [id, email, password, name, role, department] of users) {
  await db.execute("INSERT INTO profiles (id, email, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), department = VALUES(department)", [id, email, await bcrypt.hash(password, 12), name, role, department]);
}
await db.end();
console.log("Demo users seeded.");

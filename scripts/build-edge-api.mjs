import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "server", "src", "index.js");
const outputPath = path.join(root, "supabase", "functions", "api", "generated-app.js");

let source = fs.readFileSync(sourcePath, "utf8");
source = source
  .replace(/import "dotenv\/config";\r?\n/, "")
  .replace('import express from "express";', 'import express, { cors } from "./edge-express.ts";')
  .replace(/import cors from "cors";\r?\n/, "")
  .replace('import bcrypt from "bcryptjs";', 'import bcrypt from "npm:bcryptjs@2.4.3";')
  .replace('import jwt from "jsonwebtoken";', 'import jwt from "npm:jsonwebtoken@9.0.2";')
  .replace('import pg from "pg";', 'import pg from "npm:pg@8.23.0";')
  .replace('import crypto from "node:crypto";', 'import crypto from "node:crypto";')
  .replace("import { importStallRows } from './stallImport.js';", "import { importStallRows } from './stallImport.js';")
  .replace('import nodemailer from "nodemailer";', 'import nodemailer from "npm:nodemailer@10.0.0";')
  .replace('import { OAuth2Client } from "google-auth-library";', 'import { OAuth2Client } from "npm:google-auth-library@11.0.2";')
  .replace('import { createClient } from "@supabase/supabase-js";', 'import { createClient } from "npm:@supabase/supabase-js@2.112.3";')
  .replace('const jwtSecret = process.env.JWT_SECRET;', 'const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;')
  .replace(/process\.env\.DATABASE_URL/g, "(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL)")
  .replace('return process.env.API_PUBLIC_URL || `http://localhost:${port}`;', 'return process.env.API_PUBLIC_URL || `${process.env.SUPABASE_URL}/functions/v1/api`;')
  .replace(/app\.listen\(port, \(\) => console\.log\(`PubMark API listening on \$\{port\}`\)\);\s*$/, "export { app };\n");

fs.writeFileSync(outputPath, source);
fs.copyFileSync(
  path.join(root, "server", "src", "stallImport.js"),
  path.join(root, "supabase", "functions", "api", "stallImport.js"),
);
console.log(`Generated ${path.relative(root, outputPath)}`);

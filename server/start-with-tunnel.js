// Starts a Cloudflare quick tunnel, captures the fresh random URL it prints
// (a new one every run — quick tunnels aren't permanent), writes it into
// API_PUBLIC_URL in .env, then starts the API server. Run this instead of
// `npm run dev` + manually pasting the tunnel URL every time.
//
// Usage: node start-with-tunnel.js   (or `npm run dev:tunnel`)

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");
const PORT = process.env.PORT || 4000;

function updateApiPublicUrl(url) {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  if (/^API_PUBLIC_URL=.*$/m.test(content)) {
    content = content.replace(/^API_PUBLIC_URL=.*$/m, `API_PUBLIC_URL=${url}`);
  } else {
    content += `${content.length > 0 && !content.endsWith("\n") ? "\n" : ""}API_PUBLIC_URL=${url}\n`;
  }
  writeFileSync(envPath, content);
  console.log(`\n[start-with-tunnel] API_PUBLIC_URL updated -> ${url}\n`);
}

let serverProcess = null;

function startServer() {
  // node --watch does NOT reread .env on its own — the server must be
  // (re)started fresh after the file is updated, which is why this script
  // writes .env BEFORE spawning the server rather than after.
  console.log("[start-with-tunnel] Starting API server...");
  serverProcess = spawn("node", ["--watch", "src/index.js"], {
    cwd: __dirname,
    stdio: "inherit",
  });
  serverProcess.on("exit", (code) => {
    console.log(`[start-with-tunnel] Server exited (${code}). Stopping tunnel.`);
    tunnel.kill();
    process.exit(code ?? 0);
  });
}

console.log("[start-with-tunnel] Starting Cloudflare quick tunnel...");
const tunnel = spawn(
  "cloudflared",
  ["tunnel", "--url", `http://localhost:${PORT}`, "--no-autoupdate"],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let urlCaptured = false;

function handleTunnelOutput(data) {
  const text = data.toString();
  process.stdout.write(text.startsWith("[") ? text : `[cloudflared] ${text}`);
  if (urlCaptured) return;
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match) {
    urlCaptured = true;
    updateApiPublicUrl(match[0]);
    startServer();
  }
}

tunnel.stdout.on("data", handleTunnelOutput);
tunnel.stderr.on("data", handleTunnelOutput);

tunnel.on("exit", (code) => {
  console.log(`[start-with-tunnel] cloudflared exited (${code}).`);
  if (serverProcess) serverProcess.kill();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  tunnel.kill();
  if (serverProcess) serverProcess.kill();
  process.exit(0);
});

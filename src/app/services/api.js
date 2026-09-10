import { clearSession } from "../components/authStorage";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
// A configured URL pointing at "localhost" only works on the machine running
// the backend. When the app is loaded from another device on the LAN (via
// the host machine's IP), derive the API URL from that same host instead,
// so `npm run dev` works across devices with no per-device config.
const API_BASE_URL =
  configuredApiBaseUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(configuredApiBaseUrl)
    ? configuredApiBaseUrl
    : typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:4000/api`
      : configuredApiBaseUrl;

export class ApiConfigurationError extends Error {
  constructor() {
    super("The API is not configured. Set VITE_API_BASE_URL in .env.local.");
  }
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiFetch(path, init = {}) {
  if (!API_BASE_URL) throw new ApiConfigurationError();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // The server flags EVERY authenticated request this way once an admin
    // approves closing an account, not just login — so a vendor who's still
    // signed in gets kicked out on their very next action instead of staying
    // in until the session cookie's normal 8h expiry.
    if (response.status === 401) {
      clearSession();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("pubmark:unauthorized"));
    }
    throw new ApiError(error.message || "Unable to complete the request.", response.status, error.code);
  }
  return response.json();
}

export async function login(email, password) {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function registerVendor(input) {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

// `credential` is the raw Google ID token from <GoogleLogin>'s onSuccess.
// Response is one of: { profile, token } (existing confirmed account —
// same shape as login()), a thrown ApiError with code "pending_confirmation"
// (existing but unconfirmed), or { needsSignup: true, email, name }.
export async function loginWithGoogle(credential) {
  return apiFetch("/auth/google/login", { method: "POST", body: JSON.stringify({ credential }) });
}

// `credential` must be the same ID token passed to loginWithGoogle() — the
// server re-verifies it to derive the email, so there's no email field
// here to send. `fields` is { name, phone, address, password }.
export async function completeGoogleSignup(credential, fields) {
  return apiFetch("/auth/google/register", { method: "POST", body: JSON.stringify({ credential, ...fields }) });
}

export async function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function getCurrentProfile() {
  return apiFetch("/auth/me");
}

export async function findUserByEmail(email) {
  const query = new URLSearchParams({ email: email.trim().toLowerCase() });
  return apiFetch(`/auth/users/by-email?${query.toString()}`);
}

export async function listUsers(role) {
  const query = new URLSearchParams();
  if (role) query.set("role", role);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/users${suffix}`);
}

export async function listUsersPage(params) {
  const query = new URLSearchParams();
  if (params.role && params.role !== "all") query.set("role", params.role);
  if (params.search) query.set("search", params.search);
  if (params.activeOnly) query.set("activeOnly", "true");
  if (params.sortField) query.set("sortField", params.sortField);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch(`/users?${query.toString()}`);
}

export async function createUser(data) {
  // The account doesn't exist yet — this only sends a confirmation email and
  // creates a pending invitation. See getPendingUsers().
  return apiFetch("/users", { method: "POST", body: JSON.stringify(data) });
}

export async function getPendingUsers() {
  const result = await apiFetch("/pending-users");
  return result.pendingUsers;
}

export async function resendPendingUser(id) {
  return apiFetch(`/pending-users/${id}/resend`, { method: "POST" });
}

export async function cancelPendingUser(id) {
  return apiFetch(`/pending-users/${id}`, { method: "DELETE" });
}

// Asks the server for a one-time upload link into private Storage. See
// services/fileUpload.js's uploadFileDirect() for the full upload flow.
export async function signUpload({ purpose, fileName, mimeType, fileSize }) {
  return apiFetch("/uploads/sign", {
    method: "POST",
    body: JSON.stringify({ purpose, fileName, mimeType, fileSize }),
  });
}

export async function updateUserApi(id, data) {
  const result = await apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return result.user;
}

export async function deleteUserApi(id) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}

export { apiFetch };

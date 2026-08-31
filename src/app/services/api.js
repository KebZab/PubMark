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

async function apiFetch(path, init = {}) {
  if (!API_BASE_URL) throw new ApiConfigurationError();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Unable to complete the request.");
  }
  return response.json();
}

export async function login(email, password) {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function registerVendor(input) {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify(input) });
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
  if (params.sortField) query.set("sortField", params.sortField);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch(`/users?${query.toString()}`);
}

export async function createUser(data) {
  const result = await apiFetch("/users", { method: "POST", body: JSON.stringify(data) });
  return result.user;
}

export async function updateUserApi(id, data) {
  const result = await apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return result.user;
}

export async function deleteUserApi(id) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}

export { apiFetch };

import type { UserRole } from "../components/authStorage";

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

export interface ApiProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  address?: string;
  phone?: string;
  department?: string;
  createdAt?: string;
}

export class ApiConfigurationError extends Error {
  constructor() { super("The API is not configured. Set VITE_API_BASE_URL in .env.local."); }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return apiFetch<{ profile: ApiProfile }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function registerVendor(input: { name: string; email: string; password: string; phone: string; address: string }) {
  return apiFetch<{ profile: ApiProfile }>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export async function logout() {
  return apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });
}

export async function getCurrentProfile() {
  return apiFetch<{ profile: ApiProfile }>("/auth/me");
}

export async function findUserByEmail(email: string) {
  const query = new URLSearchParams({ email: email.trim().toLowerCase() });
  return apiFetch<{ profile: ApiProfile }>(`/auth/users/by-email?${query.toString()}`);
}

export async function listUsers(role?: UserRole) {
  const query = new URLSearchParams();
  if (role) query.set("role", role);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ users: ApiProfile[] }>(`/users${suffix}`);
}

export { apiFetch };

import type { UserRole } from "../components/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

export interface ApiProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  address?: string;
  phone?: string;
  department?: string;
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

export { apiFetch };

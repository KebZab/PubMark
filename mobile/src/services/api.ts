import { getToken, type StoredProfile } from "./tokenStore";
import { resolveApiBaseUrl } from "./apiBaseUrl";
import type { Announcement, Application, Stall } from "./types";

// Mirrors src/app/services/api.ts in the web app, with one difference:
// the web app relies on an httpOnly session cookie, which React Native does
// not persist reliably. Here we send the same JWT as an Authorization header
// instead. The server accepts either.

export class ApiConfigurationError extends Error {
  constructor() {
    super(
      "Could not work out the API address. In development this is normally automatic; for a production build, set EXPO_PUBLIC_API_BASE_URL in mobile/.env."
    );
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Resolved per call, not once at import, so it still adapts if the dev
  // server's host changes between reloads.
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) throw new ApiConfigurationError();

  const token = await getToken();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (networkError) {
    // A network-level failure ("host unreachable" and friends) is impossible to
    // diagnose without knowing which address was attempted, so surface it.
    throw new Error(
      `Could not reach the server at ${baseUrl} — ${(networkError as Error).message}`
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { message?: string }).message || "Unable to complete the request.");
  }
  return response.json() as Promise<T>;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  return apiFetch<{ profile: StoredProfile; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerVendor(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}) {
  return apiFetch<{ profile: StoredProfile; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCurrentProfile() {
  return apiFetch<{ profile: StoredProfile }>("/auth/me");
}

export async function logout() {
  return apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });
}

// ── Domain data ─────────────────────────────────────────────────────────────

export async function getApplications() {
  return apiFetch<{ applications: Application[] }>("/applications");
}

export async function getAnnouncements() {
  return apiFetch<{ announcements: Announcement[] }>("/announcements");
}

export async function getStalls() {
  return apiFetch<{ stalls: Stall[] }>("/stalls");
}

export async function createApplication(input: {
  stallId: string;
  businessName: string;
  businessType: string;
  contractStart: string;
  contractTermMonths: string;
  contractEnd: string;
  permitPath?: string | null;
  additionalFilePath?: string | null;
  notes?: string;
}) {
  return apiFetch<{ application: Application }>("/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

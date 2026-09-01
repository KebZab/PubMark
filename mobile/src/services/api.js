import { getToken } from "./tokenStore";
import { resolveApiBaseUrl } from "./apiBaseUrl";

// Mirrors src/app/services/api.ts in the web app, with one difference:
// the web app relies on an httpOnly session cookie, which React Native does
// not persist reliably. Here we send the same JWT as an Authorization header
// instead. The server accepts either.

export class ApiConfigurationError extends Error {
  constructor() {
    super(
      "Could not work out the API address. In development this is normally automatic; for a production build, set EXPO_PUBLIC_API_BASE_URL in mobile/.env.",
    );
  }
}

export async function apiFetch(path, init = {}) {
  // Resolved per call, not once at import, so it still adapts if the dev
  // server's host changes between reloads.
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) throw new ApiConfigurationError();

  const token = await getToken();

  let response;
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
    throw new Error(`Could not reach the server at ${baseUrl} — ${networkError.message}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Unable to complete the request.");
  }
  return response.json();
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerVendor(input) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCurrentProfile() {
  return apiFetch("/auth/me");
}

export async function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

// ── Domain data ─────────────────────────────────────────────────────────────

export async function getApplications() {
  return apiFetch("/applications");
}

export async function getAnnouncements() {
  return apiFetch("/announcements");
}

export async function getStalls() {
  return apiFetch("/stalls");
}

export async function createApplication(input) {
  return apiFetch("/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Vendors may attach a permit to their own application after submitting.
 * @param {{name: string, type: string, size: number, base64: string}} permit
 *   read by readAssetForUpload — the server stores the real file.
 */
export async function updateApplicationPermit(id, permit) {
  return apiFetch(`/applications/${id}/permit`, {
    method: "PATCH",
    body: JSON.stringify({ permit }),
  });
}

// ── Stall transfers ─────────────────────────────────────────────────────────

export async function getTransfers() {
  return apiFetch("/transfers");
}

export async function createTransfer(input) {
  return apiFetch("/transfers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function respondToTransfer(id, status) {
  return apiFetch(`/transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Officer: violations and inspections ─────────────────────────────────────

export async function getViolations() {
  return apiFetch("/violations");
}

export async function createViolation(input) {
  return apiFetch("/violations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateViolation(id, patch) {
  return apiFetch(`/violations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function getCheckRequests() {
  return apiFetch("/check-requests");
}

export async function updateCheckRequest(id, patch) {
  return apiFetch(`/check-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ── Payment receipts ────────────────────────────────────────────────────────

export async function getReceipts() {
  return apiFetch("/receipts");
}

/**
 * Records a receipt, including the file itself. `input.file` comes from
 * readAssetForUpload, so it carries base64 contents the server stores in
 * Supabase Storage and later hands back as a short-lived signed link.
 */
export async function createReceipt(input) {
  return apiFetch("/receipts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

import { getToken, clearSession } from "./tokenStore";
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

// Set once by AuthContext on mount. The server flags EVERY authenticated
// request with `code: "account_terminated"` once an admin approves closing
// an account, not just login — this is what lets apiFetch notice mid-session
// (from whatever screen happens to be active) and force a clean logout,
// instead of the app just sitting there throwing errors until the token's
// normal 8h expiry.
let onAccountTerminated = null;
export function setAccountTerminatedHandler(handler) {
  onAccountTerminated = handler;
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
    if (error.code === "account_terminated") {
      await clearSession();
      onAccountTerminated?.();
    }
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

/**
 * Which stalls have an approved application, and which have a pending one
 * with no decision yet — from anyone, no other detail. GET /applications
 * only ever returns the signed-in vendor's own rows, so it can't say
 * whether some other stall has activity on it. The map uses this for that,
 * without exposing who applied — a pending application doesn't reserve a
 * stall (someone else can still apply too), but it should read as pending
 * to every vendor, not only to whoever applied first.
 * @returns {Promise<{approved: string[], pending: string[]}>}
 */
export async function getStallReservations() {
  const result = await apiFetch("/applications/occupied-stalls");
  return { approved: result.stallIds, pending: result.pendingStallIds };
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

// ── Termination requests ────────────────────────────────────────────────────

/**
 * Requests closing the whole account (`type: "account"`) or ending a single
 * stall contract (`type: "contract"`, with `stallId`) — an admin reviews and
 * approves/rejects it, this only ever queues the request.
 * @param {{type: "account"|"contract", stallId?: string, reason: string}} input
 */
export async function createTerminationRequest(input) {
  return apiFetch("/termination-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getContractRenewals() {
  return apiFetch("/contract-renewals");
}

export async function requestContractRenewal(applicationId, requestedMonths) {
  return apiFetch("/contract-renewals", {
    method: "POST",
    body: JSON.stringify({ applicationId, requestedMonths: Number(requestedMonths) }),
  });
}

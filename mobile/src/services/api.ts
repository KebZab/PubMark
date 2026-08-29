import { getToken, type StoredProfile } from "./tokenStore";
import { resolveApiBaseUrl } from "./apiBaseUrl";
import type { Announcement, Application, CheckRequest, CheckStatus, PaymentReceipt, Stall, TransferRequest, Violation, ViolationStatus } from "./types";

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
  /** Optional; falls back to the vendor's profile address when omitted. */
  applicantAddress?: string;
}) {
  return apiFetch<{ application: Application }>("/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Vendors may attach a permit to their own application after submitting. */
export async function updateApplicationPermit(id: string, permitFileName: string) {
  return apiFetch<{ application: Application }>(`/applications/${id}/permit`, {
    method: "PATCH",
    body: JSON.stringify({ permitFileName }),
  });
}

// ── Stall transfers ─────────────────────────────────────────────────────────

export async function getTransfers() {
  return apiFetch<{ transfers: TransferRequest[] }>("/transfers");
}

export async function createTransfer(input: {
  stallId: string;
  toUserEmail: string;
  originalApplicationId: string;
}) {
  return apiFetch<{ transfer: TransferRequest }>("/transfers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function respondToTransfer(id: string, status: "accepted" | "declined") {
  return apiFetch<{ transfer: TransferRequest }>(`/transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Officer: violations and inspections ─────────────────────────────────────

export async function getViolations() {
  return apiFetch<{ violations: Violation[] }>("/violations");
}

export async function createViolation(input: {
  stallId: string;
  category: string;
  description: string;
  vendorId?: string | null;
  remarks?: string;
  evidence?: { name: string; type: string; size: string }[];
}) {
  return apiFetch<{ violation: Violation }>("/violations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateViolation(
  id: string,
  patch: { status?: ViolationStatus; remarks?: string }
) {
  return apiFetch<{ violation: Violation }>(`/violations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function getCheckRequests() {
  return apiFetch<{ requests: CheckRequest[] }>("/check-requests");
}

export async function updateCheckRequest(
  id: string,
  patch: {
    status?: CheckStatus;
    completionNotes?: string;
    completionSummary?: string;
    assignedTo?: string | null;
    completionFiles?: { name: string; type: string; size: string }[];
  }
) {
  return apiFetch<{ request: CheckRequest }>(`/check-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ── Payment receipts ────────────────────────────────────────────────────────

export async function getReceipts() {
  return apiFetch<{ receipts: PaymentReceipt[] }>("/receipts");
}

/**
 * Records a receipt. We send the file's name and type but not its contents,
 * matching how permits and violation evidence work elsewhere in the app — the
 * server stores the metadata and skips the upload when no contents are given.
 */
export async function createReceipt(input: {
  stallId: string;
  amount?: string | null;
  receiptDate?: string;
  notes?: string;
  file: { name: string; type: string; size?: number };
}) {
  return apiFetch<{ receipt: PaymentReceipt }>("/receipts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

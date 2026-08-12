import { apiFetch, type ApiProfile } from "./api";

const MIGRATION_KEY = "pubmark_db_request_migration_v1";

type LegacyViolationRequest = {
  stallId: string;
  reason: string;
  status?: "pending" | "assigned" | "completed";
  assignedOfficerName?: string;
  createdAt?: string;
  completedAt?: string | null;
};

type LegacyCheckRequest = {
  stallId: string;
  priority?: "low" | "normal" | "high" | "urgent";
  reason: string;
  notes?: string;
  status?: "pending" | "completed" | "cancelled";
  assignedToName?: string | null;
  createdAt?: string;
  completedAt?: string | null;
  completionNotes?: string;
  completionSummary?: string;
  completionFiles?: Array<{ name: string; type: "image" | "video" | "document"; size: string }>;
};

type LegacyTerminationRequest = {
  type: "account" | "contract";
  vendorId?: string;
  vendorName?: string;
  vendorEmail?: string;
  stallId?: string;
  reason: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
  resolvedAt?: string;
};

type LegacyViolation = {
  stallId: string;
  category: string;
  description: string;
  status?: "open" | "resolved" | "dismissed";
  remarks?: string;
  evidence?: Array<{ name: string; type: "image" | "video" | "document"; size: string }>;
  officerName?: string;
  createdAt?: string;
  resolvedAt?: string | null;
};

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function findUserByName(users: ApiProfile[], name?: string | null) {
  const normalized = String(name || "").trim().toLowerCase();
  if (!normalized) return null;
  return users.find((user) => user.name.trim().toLowerCase() === normalized) || null;
}

function findUserByEmail(users: ApiProfile[], email?: string | null) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  return users.find((user) => user.email.trim().toLowerCase() === normalized) || null;
}

export async function migrateLegacyRequests(sessionUserId: string, users: ApiProfile[]) {
  if (localStorage.getItem(MIGRATION_KEY) === "done") return;

  const legacyViolationRequests = readArray<LegacyViolationRequest>("pubmark_violation_requests");
  const legacyCheckRequests = readArray<LegacyCheckRequest>("pubmark_check_requests");
  const legacyTerminationRequests = readArray<LegacyTerminationRequest>("pubmark_termination_requests");
  const legacyViolations = readArray<LegacyViolation>("pubmark_violations");

  if (
    legacyViolationRequests.length === 0 &&
    legacyCheckRequests.length === 0 &&
    legacyTerminationRequests.length === 0 &&
    legacyViolations.length === 0
  ) {
    localStorage.setItem(MIGRATION_KEY, "done");
    return;
  }

  for (const request of legacyViolationRequests) {
    const assignedOfficer = findUserByName(users, request.assignedOfficerName);
    await apiFetch("/violation-requests", {
      method: "POST",
      body: JSON.stringify({
        stallId: request.stallId,
        reason: request.reason,
        requestedBy: sessionUserId,
        assignedOfficerId: assignedOfficer?.id,
        status: request.status || (assignedOfficer ? "assigned" : "pending"),
        createdAt: request.createdAt,
        completedAt: request.completedAt,
      }),
    });
  }

  for (const request of legacyCheckRequests) {
    const assignedOfficer = findUserByName(users, request.assignedToName);
    await apiFetch("/check-requests", {
      method: "POST",
      body: JSON.stringify({
        stallId: request.stallId,
        requestedBy: sessionUserId,
        assignedTo: assignedOfficer?.id,
        priority: request.priority || "normal",
        reason: request.reason,
        notes: request.notes || "",
        status: request.status || "pending",
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        completionNotes: request.completionNotes || "",
        completionSummary: request.completionSummary || "",
        completionFiles: request.completionFiles || [],
      }),
    });
  }

  for (const request of legacyTerminationRequests) {
    const vendor = findUserByEmail(users, request.vendorEmail) || findUserByName(users, request.vendorName) || users.find((user) => user.id === request.vendorId) || null;
    if (!vendor) continue;
    await apiFetch("/termination-requests", {
      method: "POST",
      body: JSON.stringify({
        type: request.type,
        vendorId: vendor.id,
        stallId: request.stallId,
        reason: request.reason,
        status: request.status || "pending",
        createdAt: request.createdAt,
        resolvedAt: request.resolvedAt,
      }),
    });
  }

  for (const violation of legacyViolations) {
    const officer = findUserByName(users, violation.officerName) || findUserByEmail(users, "officer@pubmark.com");
    await apiFetch("/violations", {
      method: "POST",
      body: JSON.stringify({
        stallId: violation.stallId,
        officerId: officer?.id,
        category: violation.category,
        description: violation.description,
        status: violation.status || "open",
        remarks: violation.remarks || "",
        evidence: violation.evidence || [],
        createdAt: violation.createdAt,
        resolvedAt: violation.resolvedAt,
      }),
    });
  }

  localStorage.setItem(MIGRATION_KEY, "done");
}

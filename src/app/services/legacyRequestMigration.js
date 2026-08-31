import { apiFetch } from "./api";

const MIGRATION_KEY = "pubmark_db_request_migration_v1";

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findUserByName(users, name) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  return users.find((user) => user.name.trim().toLowerCase() === normalized) || null;
}

function findUserByEmail(users, email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  return users.find((user) => user.email.trim().toLowerCase() === normalized) || null;
}

export async function migrateLegacyRequests(sessionUserId, users) {
  if (localStorage.getItem(MIGRATION_KEY) === "done") return;

  const legacyViolationRequests = readArray("pubmark_violation_requests");
  const legacyCheckRequests = readArray("pubmark_check_requests");
  const legacyTerminationRequests = readArray("pubmark_termination_requests");
  const legacyViolations = readArray("pubmark_violations");

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
    try {
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
    } catch (error) {
      console.warn("Skipping legacy violation request during migration:", error);
    }
  }

  for (const request of legacyCheckRequests) {
    try {
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
    } catch (error) {
      console.warn("Skipping legacy check request during migration:", error);
    }
  }

  for (const request of legacyTerminationRequests) {
    const vendor =
      findUserByEmail(users, request.vendorEmail) ||
      findUserByName(users, request.vendorName) ||
      users.find((user) => user.id === request.vendorId) ||
      null;
    if (!vendor) continue;
    try {
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
    } catch (error) {
      console.warn("Skipping legacy termination request during migration:", error);
    }
  }

  for (const violation of legacyViolations) {
    try {
      const officer =
        findUserByName(users, violation.officerName) ||
        findUserByEmail(users, "officer@pubmark.com");
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
    } catch (error) {
      console.warn("Skipping legacy violation during migration:", error);
    }
  }

  localStorage.setItem(MIGRATION_KEY, "done");
}

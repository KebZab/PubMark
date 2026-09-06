import { apiFetch } from "../services/api";

/**
 * @param {{includeArchived?: boolean}} [options] By default, archived
 * violations (resolved/dismissed ones an admin has archived) are excluded —
 * pass `includeArchived: true` for a true historical count (e.g. Analytics).
 */
export async function getViolations({ includeArchived = false } = {}) {
  const response = await apiFetch(`/violations${includeArchived ? "?includeArchived=true" : ""}`);
  return response.violations;
}

export async function saveViolation(data) {
  const response = await apiFetch("/violations", {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      vendorId: null,
      category: data.category,
      description: data.description,
      status: data.status,
      evidence: data.evidence,
      remarks: data.remarks,
    }),
  });
  return response.violation;
}

export async function updateViolationStatus(id, status, remarks, newEvidence) {
  const response = await apiFetch(`/violations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      remarks,
      evidence: newEvidence,
    }),
  });
  return response.violation;
}

export async function addOngoingUpdate(id, remarks, newEvidence) {
  const response = await apiFetch(`/violations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "open",
      remarks,
      evidence: newEvidence,
    }),
  });
  return response.violation;
}

export async function assignOfficer(violationId, officerId, _officerName) {
  const response = await apiFetch(`/violations/${violationId}`, {
    method: "PATCH",
    body: JSON.stringify({
      officerId,
    }),
  });
  return response.violation;
}

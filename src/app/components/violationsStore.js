import { apiFetch } from "../services/api";

export async function getViolations() {
  const response = await apiFetch("/violations");
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

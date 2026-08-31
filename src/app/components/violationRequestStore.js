import { apiFetch } from "../services/api";

export async function getViolationRequests() {
  const response = await apiFetch("/violation-requests");
  return response.requests;
}

export async function createViolationRequest(data) {
  const response = await apiFetch("/violation-requests", {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      reason: data.reason,
    }),
  });
  return response.request;
}

export async function assignRequestToOfficer(requestId, officerId, _officerName) {
  const response = await apiFetch(`/violation-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({
      assignedOfficerId: officerId,
      status: "assigned",
    }),
  });
  return response.request;
}

export async function completeViolationRequest(requestId) {
  const response = await apiFetch(`/violation-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
  return response.request;
}

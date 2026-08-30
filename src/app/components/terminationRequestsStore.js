import { apiFetch } from "../services/api";

export async function getTerminationRequests() {
  const response = await apiFetch("/termination-requests");
  return response.requests;
}

export async function saveTerminationRequest(data) {
  const response = await apiFetch("/termination-requests", {
    method: "POST",
    body: JSON.stringify({
      type: data.type,
      stallId: data.stallId,
      reason: data.reason,
    }),
  });
  return response.request;
}

export async function updateTerminationStatus(id, status) {
  const response = await apiFetch(`/termination-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return response.request;
}

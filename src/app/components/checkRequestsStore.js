import { apiFetch } from "../services/api";

export async function getCheckRequests() {
  const response = await apiFetch("/check-requests");
  return response.requests;
}

export async function saveCheckRequest(data) {
  const response = await apiFetch("/check-requests", {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      assignedTo: data.assignedTo,
      priority: data.priority,
      reason: data.reason,
      notes: data.notes,
    }),
  });
  return response.request;
}

export async function upsertCheckRequest(request) {
  const response = await apiFetch(`/check-requests/${request.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      assignedTo: request.assignedTo,
      priority: request.priority,
      reason: request.reason,
      notes: request.notes,
      status: request.status,
      completionNotes: request.completionNotes,
      completionSummary: request.completionSummary,
      completionFiles: request.completionFiles,
    }),
  });
  return response.request;
}

export async function updateCheckRequestStatus(
  id,
  status,
  completionNotes,
  completionSummary,
  completionFiles,
) {
  const response = await apiFetch(`/check-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      completionNotes,
      completionSummary,
      completionFiles,
    }),
  });
  return response.request;
}

export async function deleteCheckRequest(id) {
  await apiFetch(`/check-requests/${id}`, { method: "DELETE" });
}

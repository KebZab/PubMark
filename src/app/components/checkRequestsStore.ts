import { apiFetch } from "../services/api";

export type RequestStatus = "pending" | "completed" | "cancelled";
export type RequestPriority = "low" | "normal" | "high" | "urgent";

export interface CompletionFile {
  name: string;
  type: "image" | "video" | "document";
  size: string;
}

export interface OfficerCheckRequest {
  id: string;
  stallId: string;
  stallName: string;
  requestedBy: string;
  requestedByName: string;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: RequestPriority;
  reason: string;
  notes: string;
  status: RequestStatus;
  createdAt: string;
  completedAt: string | null;
  completionNotes: string;
  completionSummary: string;
  completionFiles: CompletionFile[];
  requestSource?: "check" | "violation";
}

export async function getCheckRequests(): Promise<OfficerCheckRequest[]> {
  const response = await apiFetch<{ requests: OfficerCheckRequest[] }>("/check-requests");
  return response.requests;
}

export async function saveCheckRequest(
  data: Omit<OfficerCheckRequest, "id" | "createdAt" | "completedAt" | "completionSummary" | "completionFiles">
): Promise<OfficerCheckRequest> {
  const response = await apiFetch<{ request: OfficerCheckRequest }>("/check-requests", {
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

export async function upsertCheckRequest(request: OfficerCheckRequest): Promise<OfficerCheckRequest> {
  const response = await apiFetch<{ request: OfficerCheckRequest }>(`/check-requests/${request.id}`, {
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
  id: string,
  status: RequestStatus,
  completionNotes?: string,
  completionSummary?: string,
  completionFiles?: CompletionFile[]
): Promise<OfficerCheckRequest> {
  const response = await apiFetch<{ request: OfficerCheckRequest }>(`/check-requests/${id}`, {
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

export async function deleteCheckRequest(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/check-requests/${id}`, { method: "DELETE" });
}

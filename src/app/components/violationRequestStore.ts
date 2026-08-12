import { apiFetch } from "../services/api";

export interface ViolationCheckRequest {
  id: string;
  stallId: string;
  stallName: string;
  requestedBy: string;
  requestedByName: string;
  reason: string;
  status: "pending" | "assigned" | "completed";
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  completedAt: string | null;
}

export async function getViolationRequests(): Promise<ViolationCheckRequest[]> {
  const response = await apiFetch<{ requests: ViolationCheckRequest[] }>("/violation-requests");
  return response.requests;
}

export async function createViolationRequest(
  data: Omit<ViolationCheckRequest, "id" | "createdAt" | "completedAt" | "status">
): Promise<ViolationCheckRequest> {
  const response = await apiFetch<{ request: ViolationCheckRequest }>("/violation-requests", {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      reason: data.reason,
    }),
  });
  return response.request;
}

export async function assignRequestToOfficer(
  requestId: string,
  officerId: string,
  _officerName: string
): Promise<ViolationCheckRequest> {
  const response = await apiFetch<{ request: ViolationCheckRequest }>(`/violation-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({
      assignedOfficerId: officerId,
      status: "assigned",
    }),
  });
  return response.request;
}

export async function completeViolationRequest(requestId: string): Promise<ViolationCheckRequest> {
  const response = await apiFetch<{ request: ViolationCheckRequest }>(`/violation-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
  return response.request;
}

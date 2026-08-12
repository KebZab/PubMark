import { apiFetch } from "../services/api";

export type TerminationType = "account" | "contract";
export type TerminationStatus = "pending" | "approved" | "rejected";

export interface TerminationRequest {
  id: string;
  type: TerminationType;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  stallId?: string;
  stallName?: string;
  reason: string;
  status: TerminationStatus;
  createdAt: string;
  resolvedAt?: string;
}

export async function getTerminationRequests(): Promise<TerminationRequest[]> {
  const response = await apiFetch<{ requests: TerminationRequest[] }>("/termination-requests");
  return response.requests;
}

export async function saveTerminationRequest(
  data: Omit<TerminationRequest, "id" | "createdAt" | "status">
): Promise<TerminationRequest> {
  const response = await apiFetch<{ request: TerminationRequest }>("/termination-requests", {
    method: "POST",
    body: JSON.stringify({
      type: data.type,
      stallId: data.stallId,
      reason: data.reason,
    }),
  });
  return response.request;
}

export async function updateTerminationStatus(
  id: string,
  status: TerminationStatus
): Promise<TerminationRequest> {
  const response = await apiFetch<{ request: TerminationRequest }>(`/termination-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return response.request;
}

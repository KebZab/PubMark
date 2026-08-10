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

const KEY = "pubmark_termination_requests";

export function getTerminationRequests(): TerminationRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TerminationRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveTerminationRequest(
  data: Omit<TerminationRequest, "id" | "createdAt" | "status">
): TerminationRequest {
  const requests = getTerminationRequests();
  const req: TerminationRequest = {
    ...data,
    id: `term_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.unshift(req);
  localStorage.setItem(KEY, JSON.stringify(requests));
  return req;
}

export function updateTerminationStatus(
  id: string,
  status: TerminationStatus
): TerminationRequest | null {
  const requests = getTerminationRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status, resolvedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(requests));
  return requests[idx];
}

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

const KEY = "pubmark_violation_requests";

export function getViolationRequests(): ViolationCheckRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ViolationCheckRequest[]) : [];
  } catch {
    return [];
  }
}

export function createViolationRequest(
  data: Omit<ViolationCheckRequest, "id" | "createdAt" | "completedAt" | "status">
): ViolationCheckRequest {
  const requests = getViolationRequests();
  const request: ViolationCheckRequest = {
    ...data,
    id: `vreq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  requests.unshift(request);
  localStorage.setItem(KEY, JSON.stringify(requests));
  return request;
}

export function assignRequestToOfficer(
  requestId: string,
  officerId: string,
  officerName: string
): ViolationCheckRequest | null {
  const requests = getViolationRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = {
    ...requests[idx],
    status: "assigned",
    assignedOfficerId: officerId,
    assignedOfficerName: officerName,
  };
  localStorage.setItem(KEY, JSON.stringify(requests));
  return requests[idx];
}

export function completeViolationRequest(requestId: string): ViolationCheckRequest | null {
  const requests = getViolationRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = {
    ...requests[idx],
    status: "completed",
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(requests));
  return requests[idx];
}

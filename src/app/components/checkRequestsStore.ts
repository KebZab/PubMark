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
}

const KEY = "pubmark_check_requests";

export function getCheckRequests(): OfficerCheckRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfficerCheckRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveCheckRequest(
  data: Omit<OfficerCheckRequest, "id" | "createdAt" | "completedAt" | "completionSummary" | "completionFiles">
): OfficerCheckRequest {
  const requests = getCheckRequests();
  const request: OfficerCheckRequest = {
    ...data,
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    completedAt: null,
    completionSummary: "",
    completionFiles: [],
  };
  requests.unshift(request);
  localStorage.setItem(KEY, JSON.stringify(requests));
  return request;
}

export function updateCheckRequestStatus(
  id: string,
  status: RequestStatus,
  completionNotes?: string,
  completionSummary?: string,
  completionFiles?: CompletionFile[]
): OfficerCheckRequest | null {
  const requests = getCheckRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  requests[idx] = {
    ...requests[idx],
    status,
    completionNotes: completionNotes ?? requests[idx].completionNotes,
    completionSummary: completionSummary ?? requests[idx].completionSummary,
    completionFiles: completionFiles ?? requests[idx].completionFiles,
    completedAt: status !== "pending" ? new Date().toISOString() : null,
  };
  localStorage.setItem(KEY, JSON.stringify(requests));
  return requests[idx];
}

export function deleteCheckRequest(id: string): void {
  const requests = getCheckRequests().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(requests));
}

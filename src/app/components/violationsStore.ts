import { apiFetch } from "../services/api";

export type ViolationCategory =
  | "Illegal Vending"
  | "Health Violation"
  | "Fire Hazard"
  | "Unauthorized Expansion"
  | "Noise Violation"
  | "Improper Waste Disposal"
  | "Permit Expired"
  | "Other";

export type ViolationStatus = "open" | "resolved" | "dismissed";

export interface ViolationEvidence {
  name: string;
  type: "image" | "video" | "document";
  size: string;
}

export interface Violation {
  id: string;
  stallId: string;
  stallName: string;
  vendorName: string;
  officerId: string;
  officerName: string;
  category: ViolationCategory;
  description: string;
  status: ViolationStatus;
  evidence: ViolationEvidence[];
  remarks: string;
  createdAt: string;
  resolvedAt: string | null;
}

export async function getViolations(): Promise<Violation[]> {
  const response = await apiFetch<{ violations: Violation[] }>("/violations");
  return response.violations;
}

export async function saveViolation(data: Omit<Violation, "id" | "createdAt" | "resolvedAt">): Promise<Violation> {
  const response = await apiFetch<{ violation: Violation }>("/violations", {
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

export async function updateViolationStatus(
  id: string,
  status: ViolationStatus,
  remarks?: string,
  newEvidence?: ViolationEvidence[],
): Promise<Violation> {
  const response = await apiFetch<{ violation: Violation }>(`/violations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      remarks,
      evidence: newEvidence,
    }),
  });
  return response.violation;
}

export async function addOngoingUpdate(
  id: string,
  remarks: string,
  newEvidence: ViolationEvidence[],
): Promise<Violation> {
  const response = await apiFetch<{ violation: Violation }>(`/violations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "open",
      remarks,
      evidence: newEvidence,
    }),
  });
  return response.violation;
}

export async function assignOfficer(violationId: string, officerId: string, _officerName: string): Promise<Violation> {
  const response = await apiFetch<{ violation: Violation }>(`/violations/${violationId}`, {
    method: "PATCH",
    body: JSON.stringify({
      officerId,
    }),
  });
  return response.violation;
}

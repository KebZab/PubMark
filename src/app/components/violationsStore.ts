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

const KEY = "pubmark_violations";

export function getViolations(): Violation[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Violation[]) : getDefaultViolations();
  } catch {
    return getDefaultViolations();
  }
}

function getDefaultViolations(): Violation[] {
  const defaults: Violation[] = [
    {
      id: "viol_001",
      stallId: "stall_001",
      stallName: "Stall A-101",
      vendorName: "Pedro Reyes",
      officerId: "user_seeded_003",
      officerName: "Carlos Reyes",
      category: "Health Violation",
      description: "Improper food storage observed. Raw meat stored without proper refrigeration.",
      status: "open",
      evidence: [{ name: "evidence_01.jpg", type: "image", size: "2.4 MB" }],
      remarks: "Vendor was warned. Follow-up inspection scheduled.",
      createdAt: "2026-05-10T09:30:00.000Z",
      resolvedAt: null,
    },
    {
      id: "viol_002",
      stallId: "stall_002",
      stallName: "Stall B-205",
      vendorName: "Lina Gomez",
      officerId: "user_seeded_003",
      officerName: "Carlos Reyes",
      category: "Unauthorized Expansion",
      description: "Stall extended 0.5m beyond permitted boundary.",
      status: "resolved",
      evidence: [{ name: "expansion_photo.jpg", type: "image", size: "1.8 MB" }],
      remarks: "Vendor complied and removed extension. Resolved.",
      createdAt: "2026-05-08T14:15:00.000Z",
      resolvedAt: "2026-05-09T10:00:00.000Z",
    },
    {
      id: "viol_003",
      stallId: "stall_003",
      stallName: "Stall C-110",
      vendorName: "Ramon dela Cruz",
      officerId: "user_seeded_003",
      officerName: "Carlos Reyes",
      category: "Permit Expired",
      description: "Business permit expired last month. Vendor has not renewed.",
      status: "open",
      evidence: [],
      remarks: "Notice issued. Vendor has 7 days to comply.",
      createdAt: "2026-05-12T11:00:00.000Z",
      resolvedAt: null,
    },
    {
      id: "viol_004",
      stallId: "stall_004",
      stallName: "Stall D-301",
      vendorName: "Gloria Tan",
      officerId: "user_seeded_003",
      officerName: "Carlos Reyes",
      category: "Improper Waste Disposal",
      description: "Waste bags placed outside designated area, blocking aisle.",
      status: "dismissed",
      evidence: [{ name: "waste_video.mp4", type: "video", size: "18.2 MB" }],
      remarks: "Vendor disputed — investigation inconclusive. Dismissed.",
      createdAt: "2026-05-06T08:45:00.000Z",
      resolvedAt: "2026-05-07T09:00:00.000Z",
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveViolation(data: Omit<Violation, "id" | "createdAt" | "resolvedAt">): Violation {
  const violations = getViolations();
  const v: Violation = {
    ...data,
    id: `viol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  violations.unshift(v);
  localStorage.setItem(KEY, JSON.stringify(violations));
  return v;
}

export function updateViolationStatus(
  id: string,
  status: ViolationStatus,
  remarks?: string,
  newEvidence?: ViolationEvidence[],
): Violation | null {
  const violations = getViolations();
  const idx = violations.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const existingEvidence = violations[idx].evidence || [];
  violations[idx] = {
    ...violations[idx],
    status,
    remarks: remarks ?? violations[idx].remarks,
    evidence: newEvidence && newEvidence.length > 0 ? [...existingEvidence, ...newEvidence] : existingEvidence,
    resolvedAt: status !== "open" ? new Date().toISOString() : null,
  };
  localStorage.setItem(KEY, JSON.stringify(violations));
  return violations[idx];
}

export function addOngoingUpdate(
  id: string,
  remarks: string,
  newEvidence: ViolationEvidence[],
): Violation | null {
  const violations = getViolations();
  const idx = violations.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const existingEvidence = violations[idx].evidence || [];
  violations[idx] = {
    ...violations[idx],
    status: "open",
    remarks: remarks || violations[idx].remarks,
    evidence: [...existingEvidence, ...newEvidence],
    resolvedAt: null,
  };
  localStorage.setItem(KEY, JSON.stringify(violations));
  return violations[idx];
}

export function assignOfficer(violationId: string, officerId: string, officerName: string): Violation | null {
  const violations = getViolations();
  const idx = violations.findIndex((v) => v.id === violationId);
  if (idx === -1) return null;
  violations[idx] = {
    ...violations[idx],
    officerId,
    officerName,
  };
  localStorage.setItem(KEY, JSON.stringify(violations));
  return violations[idx];
}

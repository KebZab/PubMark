// Shapes returned by the existing Express API. These mirror the mapping
// functions in server/src/index.js, so field names match the wire format
// exactly (camelCase for applications, snake_case for stalls).

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  userId: string;
  stallId: string;
  stallName: string | null;
  stallSection: string | null;
  floorArea: string | null;
  applicantName: string | null;
  applicantEmail: string | null;
  applicantAddress: string | null;
  businessName: string;
  businessType: string;
  contractStart: string;
  contractTermMonths: string;
  contractEnd: string;
  permitFileName: string | null;
  additionalFileName: string | null;
  notes: string;
  status: ApplicationStatus;
  adminRemarks: string;
  dateApplied: string;
  permitDeadlineAt: string | null;
  permitTerminatedAt: string | null;
}

export type AnnouncementType = "info" | "warning" | "urgent" | "success";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  createdAt: string;
  author: string;
  authorId: string;
}

export type StallStatus = "vacant" | "occupied" | "unavailable";

// Stalls come back in snake_case (the stalls route returns raw rows).
export interface Stall {
  id: string;
  stall_name: string;
  status: StallStatus;
  business_type: string;
  section: string;
  floor: string;
  floor_area: string;
  notes: string | null;
  geometry: { type: string; coordinates: number[][][] };
  created_at: string;
}

export type TransferStatus = "pending" | "accepted" | "declined";

export interface TransferRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  stallId: string;
  stallName: string;
  stallSection: string;
  stallFloor: string;
  floorArea: string;
  originalApplicationId: string;
  status: TransferStatus;
  createdAt: string;
  respondedAt: string | null;
}

export type ViolationCategory =
  | "Illegal Vending" | "Health Violation" | "Fire Hazard"
  | "Unauthorized Expansion" | "Noise Violation" | "Improper Waste Disposal"
  | "Permit Expired" | "Other";

export type ViolationStatus = "open" | "resolved" | "dismissed";

export interface EvidenceFile {
  name: string;
  type: "image" | "video" | "document";
  size: string;
}

export interface Violation {
  id: string;
  stallId: string;
  stallName: string | null;
  vendorName: string;
  officerId: string;
  officerName: string | null;
  category: ViolationCategory;
  description: string;
  status: ViolationStatus;
  evidence: EvidenceFile[];
  remarks: string;
  createdAt: string;
  resolvedAt: string | null;
}

export type CheckPriority = "low" | "normal" | "high" | "urgent";
export type CheckStatus = "pending" | "completed" | "cancelled";

export interface CheckRequest {
  id: string;
  stallId: string;
  stallName: string | null;
  requestedBy: string;
  requestedByName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: CheckPriority;
  reason: string;
  notes: string;
  status: CheckStatus;
  createdAt: string;
  completedAt: string | null;
  completionNotes: string;
  completionSummary: string;
  completionFiles: EvidenceFile[];
}

export type ReceiptStatus = "pending" | "verified" | "rejected";

export interface PaymentReceipt {
  id: string;
  stallId: string;
  stallName: string | null;
  vendorId: string;
  vendorName: string;
  submittedBy: string;
  submittedByName: string;
  submittedByRole: string;
  amount: number | null;
  receiptDate: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  /** Null when the receipt is metadata-only (no file uploaded). */
  fileUrl: string | null;
  notes: string;
  status: ReceiptStatus;
  reviewedByName: string | null;
  reviewedAt: string | null;
  remarks: string;
  createdAt: string;
}

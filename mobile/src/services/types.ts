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

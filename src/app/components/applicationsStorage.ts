export interface StoredApplication {
  id: string;
  userId: string;
  stallId: string;
  stallName: string;
  stallSection: string;
  floorArea: string;
  applicantName: string;
  applicantEmail: string;
  applicantAddress: string;
  businessName: string;
  businessType: string;
  contractStart: string;
  contractTermMonths: string;
  contractEnd: string;
  permitFileName: string | null;
  permitFileSize: string | null;
  additionalFileName: string | null;
  additionalFileSize: string | null;
  notes: string;
  status: "pending" | "approved" | "rejected";
  dateApplied: string;
  adminRemarks: string;
}

const KEY = "pubmark_applications";

export function getStoredApplications(): StoredApplication[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const apps = JSON.parse(raw) as StoredApplication[];
    // Filter out apps with invalid dates
    return apps.filter((app) => {
      const start = new Date(app.contractStart);
      const end = new Date(app.contractEnd);
      return !isNaN(start.getTime()) && !isNaN(end.getTime());
    });
  } catch {
    return [];
  }
}

export function getApplicationById(id: string): StoredApplication | null {
  return getStoredApplications().find((a) => a.id === id) ?? null;
}

export function saveStoredApplication(
  data: Omit<StoredApplication, "id" | "dateApplied" | "status" | "adminRemarks">
): StoredApplication {
  const apps = getStoredApplications();
  const app: StoredApplication = {
    ...data,
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dateApplied: new Date().toISOString(),
    status: "pending",
    adminRemarks: "",
  };
  apps.push(app);
  localStorage.setItem(KEY, JSON.stringify(apps));
  return app;
}

export function updateApplicationStatus(
  id: string,
  status: "approved" | "rejected",
  adminRemarks?: string
): StoredApplication | null {
  const apps = getStoredApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx] = {
    ...apps[idx],
    status,
    adminRemarks: adminRemarks ?? apps[idx].adminRemarks,
  };
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps[idx];
}

export function updateApplicationPermit(
  id: string,
  permitFileName: string,
  permitFileSize: string
): StoredApplication | null {
  const apps = getStoredApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx] = { ...apps[idx], permitFileName, permitFileSize };
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps[idx];
}

export function deleteStoredApplication(id: string): void {
  const apps = getStoredApplications().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(apps));
}

export function addMonths(dateStr: string, months: number): string {
  if (!dateStr || dateStr.trim() === "") return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // Handle edge case where day doesn't exist in target month (e.g., Jan 31 -> Feb 31)
  if (d.getDate() !== day) {
    d.setDate(0); // Set to last day of previous month
  }

  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

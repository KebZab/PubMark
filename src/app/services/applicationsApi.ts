import { apiFetch } from "./api";

export interface Application {
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
  adminRemarks: string;
  dateApplied: string;
}

export async function getApplications(): Promise<Application[]> {
  const result = await apiFetch<{ applications: Application[] }>(`/applications`);
  return result.applications;
}

export async function getApplicationById(id: string): Promise<Application | null> {
  const apps = await getApplications();
  return apps.find(a => a.id === id) ?? null;
}

export async function createApplication(data: Omit<Application, "id" | "status" | "adminRemarks" | "dateApplied">): Promise<Application> {
  const result = await apiFetch<{ application: Application }>(`/applications`, {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      businessName: data.businessName,
      businessType: data.businessType,
      contractStart: data.contractStart,
      contractTermMonths: data.contractTermMonths,
      contractEnd: data.contractEnd,
      permitPath: data.permitFileName,
      additionalFilePath: data.additionalFileName,
      notes: data.notes,
    }),
  });
  return result.application;
}

export async function updateApplicationStatus(id: string, status: "approved" | "rejected", adminRemarks?: string): Promise<Application> {
  const result = await apiFetch<{ application: Application }>(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminRemarks }),
  });
  return result.application;
}

export async function deleteApplication(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/applications/${id}`, { method: "DELETE" });
}

export async function importApplications(applications: Application[]): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/applications/import`, {
    method: "POST",
    body: JSON.stringify({ applications }),
  });
}

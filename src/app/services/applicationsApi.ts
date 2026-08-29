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
  permitDeadlineAt?: string | null;
  permitDeadlineUpdatedAt?: string | null;
  permitTerminatedAt?: string | null;
}

export async function getApplications(): Promise<Application[]> {
  const result = await apiFetch<{ applications: Application[] }>(`/applications`);
  return result.applications;
}

export interface GetApplicationsPageParams {
  status?: "pending" | "approved" | "rejected" | "all";
  search?: string;
  sortField?: "date" | "stall" | "status";
  sortDir?: "asc" | "desc";
  page: number;
  pageSize: number;
}

export async function getApplicationsPage(params: GetApplicationsPageParams) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.sortField) query.set("sortField", params.sortField);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch<{ applications: Application[]; total: number }>(`/applications?${query.toString()}`);
}

export interface StallManagementRow {
  stall: import("./stallsApi").Stall;
  app: Application | null;
}

export interface GetStallsManagementPageParams {
  status?: "vacant" | "pending" | "occupied" | "all";
  floor?: "1" | "2" | "all";
  search?: string;
  page: number;
  pageSize: number;
}

export async function getStallsManagementPage(params: GetStallsManagementPageParams) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.floor && params.floor !== "all") query.set("floor", params.floor);
  if (params.search) query.set("search", params.search);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch<{ items: StallManagementRow[]; total: number }>(`/stalls/management?${query.toString()}`);
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
      // Was previously dropped here, so whatever the form collected was
      // silently discarded and the profile address shown instead.
      applicantAddress: data.applicantAddress,
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

export async function updateApplicationAdmin(
  id: string,
  data: {
    status?: "approved" | "rejected";
    adminRemarks?: string;
  },
): Promise<Application> {
  const result = await apiFetch<{ application: Application }>(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return result.application;
}

export async function updateApplicationPermit(
  id: string,
  permitFileName: string,
  permitFileSize: string,
): Promise<Application> {
  const result = await apiFetch<{ application: Application }>(`/applications/${id}/permit`, {
    method: "PATCH",
    body: JSON.stringify({ permitFileName, permitFileSize }),
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

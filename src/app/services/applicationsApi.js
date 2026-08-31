import { apiFetch } from "./api";

export async function getApplications() {
  const result = await apiFetch(`/applications`);
  return result.applications;
}

export async function getApplicationsPage(params) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.sortField) query.set("sortField", params.sortField);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch(`/applications?${query.toString()}`);
}

export async function getStallsManagementPage(params) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.floor && params.floor !== "all") query.set("floor", params.floor);
  if (params.search) query.set("search", params.search);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch(`/stalls/management?${query.toString()}`);
}

export async function getApplicationById(id) {
  const apps = await getApplications();
  return apps.find((a) => a.id === id) ?? null;
}

export async function createApplication(data) {
  const result = await apiFetch(`/applications`, {
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

export async function updateApplicationStatus(id, status, adminRemarks) {
  const result = await apiFetch(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminRemarks }),
  });
  return result.application;
}

export async function updateApplicationAdmin(id, data) {
  const result = await apiFetch(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return result.application;
}

export async function updateApplicationPermit(id, permitFileName, permitFileSize) {
  const result = await apiFetch(`/applications/${id}/permit`, {
    method: "PATCH",
    body: JSON.stringify({ permitFileName, permitFileSize }),
  });
  return result.application;
}

export async function deleteApplication(id) {
  await apiFetch(`/applications/${id}`, { method: "DELETE" });
}

export async function importApplications(applications) {
  await apiFetch(`/applications/import`, {
    method: "POST",
    body: JSON.stringify({ applications }),
  });
}

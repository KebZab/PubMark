import { apiFetch } from "./api";
import { readFileForUpload } from "./fileUpload";

export async function getApplications() {
  const result = await apiFetch(`/applications`);
  return result.applications;
}

/**
 * Which stalls have an approved application, and which have a pending one
 * awaiting a decision — no other detail. Unlike getApplications(), this
 * isn't scoped to the caller: a vendor browsing the map needs to know a
 * stall is spoken for even when someone *else* applied for it, and a guest
 * (not signed in) needs it too.
 * @returns {Promise<{approved: string[], pending: string[]}>}
 */
export async function getStallReservations() {
  const result = await apiFetch(`/applications/occupied-stalls`);
  return { approved: result.stallIds, pending: result.pendingStallIds };
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
  // The real files travel with the application; the server stores them and
  // returns signed links. `permitFile` / `additionalFile` are browser File
  // objects, read and size-checked here before being sent.
  const result = await apiFetch(`/applications`, {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      businessName: data.businessName,
      businessType: data.businessType,
      contractStart: data.contractStart,
      contractTermMonths: data.contractTermMonths,
      contractEnd: data.contractEnd,
      permit: data.permitFile ? await readFileForUpload(data.permitFile) : null,
      additionalFile: data.additionalFile ? await readFileForUpload(data.additionalFile) : null,
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

/** @param {File} permitFile the picked file, uploaded and stored server-side. */
export async function updateApplicationPermit(id, permitFile) {
  const result = await apiFetch(`/applications/${id}/permit`, {
    method: "PATCH",
    body: JSON.stringify({ permit: await readFileForUpload(permitFile) }),
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

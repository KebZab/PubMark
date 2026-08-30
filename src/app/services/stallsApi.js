import { apiFetch } from "./api";

export async function getStalls() {
  const result = await apiFetch("/stalls");
  return result.stalls;
}

export async function getStallsPage(params) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch(`/stalls?${query.toString()}`);
}

export async function createStall(data) {
  const result = await apiFetch("/stalls", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.stall;
}

export async function updateStall(id, data) {
  const result = await apiFetch(`/stalls/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return result.stall;
}

export async function updateStallGeometry(updates) {
  return apiFetch("/stalls/geometry", {
    method: "PATCH",
    body: JSON.stringify({ updates }),
  });
}

export async function deleteStall(id) {
  return apiFetch(`/stalls/${id}`, { method: "DELETE" });
}

export async function deleteStalls(ids) {
  return apiFetch("/stalls", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}

export async function importStalls(stalls) {
  const result = await apiFetch("/stalls/import", {
    method: "POST",
    body: JSON.stringify({ stalls }),
  });
  return result;
}

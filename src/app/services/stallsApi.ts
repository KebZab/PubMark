import { apiFetch } from "./api";

export interface Stall {
  id: string;
  stall_name: string;
  status: "vacant" | "occupied" | "unavailable";
  owner_id: string | null;
  business_type: string;
  section: string;
  floor: "1" | "2";
  floor_area: string;
  notes: string;
  geometry: object;
  created_at: string;
}

export async function getStalls() {
  const result = await apiFetch<{ stalls: Stall[] }>("/stalls");
  return result.stalls;
}

export interface GetStallsPageParams {
  search?: string;
  page: number;
  pageSize: number;
}

export async function getStallsPage(params: GetStallsPageParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  query.set("limit", String(params.pageSize));
  query.set("offset", String((params.page - 1) * params.pageSize));
  return apiFetch<{ stalls: Stall[]; total: number }>(`/stalls?${query.toString()}`);
}

export async function createStall(data: Omit<Stall, "id" | "owner_id" | "status" | "created_at">) {
  const result = await apiFetch<{ stall: Stall }>("/stalls", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.stall;
}

export async function updateStall(
  id: string,
  data: Partial<Omit<Stall, "id" | "owner_id" | "created_at">>,
) {
  const result = await apiFetch<{ stall: Stall }>(`/stalls/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return result.stall;
}

export async function updateStallGeometry(updates: Array<{ id: string; geometry: object }>) {
  return apiFetch<{ ok: true }>("/stalls/geometry", {
    method: "PATCH",
    body: JSON.stringify({ updates }),
  });
}

export async function deleteStall(id: string) {
  return apiFetch<{ ok: true }>(`/stalls/${id}`, { method: "DELETE" });
}

export async function deleteStalls(ids: string[]) {
  return apiFetch<{ ok: true }>("/stalls", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}

export async function importStalls(stalls: Array<{
  id: string;
  stall_name: string;
  status: "vacant" | "occupied" | "unavailable";
  business_type: string;
  section: string;
  floor: "1" | "2";
  floor_area: string;
  notes: string;
  geometry: object;
}>) {
  const result = await apiFetch<{ ok: true; idMap: Record<string, string> }>("/stalls/import", {
    method: "POST",
    body: JSON.stringify({ stalls }),
  });
  return result;
}

import { apiFetch } from "./api";

export interface Perimeter {
  id: string;
  name: string;
  geometry: object;
  createdBy: string;
  createdByName: string;
  notes: string;
  createdAt: string;
}

export async function getPerimeters(): Promise<Perimeter[]> {
  const result = await apiFetch<{ perimeters: Perimeter[] }>("/perimeters");
  return result.perimeters;
}

export async function createPerimeter(data: { name: string; geometry: object; notes: string }): Promise<Perimeter> {
  const result = await apiFetch<{ perimeter: Perimeter }>("/perimeters", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.perimeter;
}

export async function deletePerimeter(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/perimeters/${id}`, { method: "DELETE" });
}

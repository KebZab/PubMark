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

export async function getPerimeter(): Promise<Perimeter | null> {
  const result = await apiFetch<{ perimeter: Perimeter | null }>("/perimeter");
  return result.perimeter;
}

export async function savePerimeter(data: { name: string; geometry: object; notes: string }): Promise<Perimeter> {
  const result = await apiFetch<{ perimeter: Perimeter }>("/perimeter", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.perimeter;
}

export async function clearPerimeter(): Promise<void> {
  await apiFetch<{ ok: boolean }>("/perimeter", { method: "DELETE" });
}

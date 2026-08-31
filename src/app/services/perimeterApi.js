import { apiFetch } from "./api";

export async function getPerimeters() {
  const result = await apiFetch("/perimeters");
  return result.perimeters;
}

export async function createPerimeter(data) {
  const result = await apiFetch("/perimeters", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.perimeter;
}

export async function deletePerimeter(id) {
  await apiFetch(`/perimeters/${id}`, { method: "DELETE" });
}

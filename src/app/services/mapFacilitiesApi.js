import { apiFetch } from "./api";

export async function getMapFacilities(floor) {
  const query = floor ? `?floor=${encodeURIComponent(floor)}` : "";
  const result = await apiFetch(`/map-facilities${query}`);
  return result.facilities;
}

export async function createMapFacility(data) {
  const result = await apiFetch("/map-facilities", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.facility;
}

export async function updateMapFacility(id, data) {
  const result = await apiFetch(`/map-facilities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return result.facility;
}

export async function deleteMapFacility(id) {
  await apiFetch(`/map-facilities/${id}`, { method: "DELETE" });
}


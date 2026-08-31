import { apiFetch } from "./api";

export async function getAnnouncements() {
  const response = await apiFetch("/announcements");
  return response.announcements;
}

export async function createAnnouncement(input) {
  const response = await apiFetch("/announcements", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.announcement;
}

export async function deleteAnnouncement(id) {
  await apiFetch(`/announcements/${id}`, { method: "DELETE" });
}

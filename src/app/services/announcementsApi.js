import { apiFetch } from "./api";

export async function getAnnouncements() {
  const response = await apiFetch("/announcements");
  return response.announcements;
}

export async function getNotices() {
  try {
    const response = await apiFetch("/notices");
    return response.notices;
  } catch (error) {
    // Keep the original announcement feed available while the additive
    // private-notice endpoint/database migration is being rolled out.
    if (error?.status !== 404 && !(error?.status >= 500)) throw error;
    return getAnnouncements();
  }
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

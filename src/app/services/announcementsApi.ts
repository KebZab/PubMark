import { apiFetch } from "./api";

export type AnnouncementType = "info" | "warning" | "urgent" | "success";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  createdAt: string;
  author: string;
  authorId?: string;
}

export async function getAnnouncements() {
  const response = await apiFetch<{ announcements: Announcement[] }>("/announcements");
  return response.announcements;
}

export async function createAnnouncement(input: {
  title: string;
  message: string;
  type: AnnouncementType;
}) {
  const response = await apiFetch<{ announcement: Announcement }>("/announcements", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.announcement;
}

export async function deleteAnnouncement(id: string) {
  await apiFetch<{ ok: true }>(`/announcements/${id}`, { method: "DELETE" });
}

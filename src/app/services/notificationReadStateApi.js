import { apiFetch } from "./api";

export async function getNotificationReadState() {
  return apiFetch("/notification-read-state");
}

export async function markNotificationSeen(trackerKey) {
  return apiFetch(`/notification-read-state/${encodeURIComponent(trackerKey)}`, {
    method: "POST",
  });
}

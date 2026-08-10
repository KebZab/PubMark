export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent" | "success";
  createdAt: string;
  author: string;
}

const STORAGE_KEY = "stall_announcements";

const defaultAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Welcome to Stall Management Portal",
    message: "All stall applicants are reminded to submit complete documentation including business permit and valid ID. Incomplete applications will not be processed.",
    type: "info",
    createdAt: "2026-05-12T09:00:00Z",
    author: "Admin",
  },
  {
    id: "2",
    title: "Deadline Reminder: May 15 Applications",
    message: "Applications for Stalls A-101 to A-110 are due by May 15, 2026. Please ensure all required documents are uploaded before the deadline.",
    type: "warning",
    createdAt: "2026-05-10T14:00:00Z",
    author: "Admin",
  },
  {
    id: "3",
    title: "New Stalls Available in Section B",
    message: "We are pleased to announce that 8 new stalls in Section B are now open for applications. Visit the map to view their locations and submit your application.",
    type: "success",
    createdAt: "2026-05-08T10:30:00Z",
    author: "Admin",
  },
];

export function getAnnouncements(): Announcement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Announcement[];
  } catch {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnnouncements));
  return defaultAnnouncements;
}

export function saveAnnouncements(announcements: Announcement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
}

export function addAnnouncement(announcement: Omit<Announcement, "id" | "createdAt" | "author">): Announcement[] {
  const current = getAnnouncements();
  const newOne: Announcement = {
    ...announcement,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    author: "Admin",
  };
  const updated = [newOne, ...current];
  saveAnnouncements(updated);
  return updated;
}

export function deleteAnnouncement(id: string): Announcement[] {
  const current = getAnnouncements();
  const updated = current.filter((a) => a.id !== id);
  saveAnnouncements(updated);
  return updated;
}

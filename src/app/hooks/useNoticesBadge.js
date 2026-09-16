import { useMemo } from "react";
import { useAnnouncements } from "./useAnnouncements";
import { useLastSeenTracker } from "./useLastSeenTracker";

export function useNoticesBadge() {
  const { announcements } = useAnnouncements();
  const { lastSeenAt, loading, markSeen } = useLastSeenTracker("notices");

  const unreadCount = useMemo(() => {
    if (loading) return 0;
    if (!lastSeenAt) return announcements.length;

    const lastSeenTime = new Date(lastSeenAt).getTime();
    return announcements.filter(
      (announcement) => new Date(announcement.createdAt).getTime() > lastSeenTime,
    ).length;
  }, [announcements, lastSeenAt, loading]);

  return { unreadCount, markSeen };
}

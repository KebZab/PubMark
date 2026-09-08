import { useMemo } from "react";
import { useAnnouncements } from "./useAnnouncements";
import { useLastSeenTracker } from "./useLastSeenTracker";

// The only file that knows about announcements specifically — the per-user
// "last seen" plumbing itself lives in useLastSeenTracker so a future
// second notification type can reuse it with a different tracker key.
export function useNoticesBadge() {
  const { data } = useAnnouncements();
  const { lastSeenAt, isLoading, markSeen } = useLastSeenTracker("notices");

  const unreadCount = useMemo(() => {
    if (isLoading) return 0; // avoid flashing the full count before the fetch resolves
    const announcements = data?.announcements ?? [];
    if (!lastSeenAt) return announcements.length; // never viewed before on this account
    const lastSeenTime = new Date(lastSeenAt).getTime();
    return announcements.filter((a) => new Date(a.createdAt).getTime() > lastSeenTime).length;
  }, [data, lastSeenAt, isLoading]);

  return { unreadCount, markSeen };
}

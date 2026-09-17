import { useMemo } from "react";
import { useNotices } from "./useNotices";
import { useLastSeenTracker } from "./useLastSeenTracker";

export function useNoticesBadge() {
  const { notices } = useNotices();
  const { lastSeenAt, loading, markSeen } = useLastSeenTracker("notices");

  const unreadCount = useMemo(() => {
    if (loading) return 0;
    if (!lastSeenAt) return notices.length;

    const lastSeenTime = new Date(lastSeenAt).getTime();
    return notices.filter(
      (notice) => new Date(notice.createdAt).getTime() > lastSeenTime,
    ).length;
  }, [notices, lastSeenAt, loading]);

  return { unreadCount, markSeen };
}

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getNotificationReadState, markNotificationSeen } from "../services/api";

// One shared query key covers every tracker (a single GET returns every
// tracker's watermark), so adding a second notification type later costs
// zero extra network calls — it just reads a different key out of this map.
export const NOTIFICATION_READ_STATE_QUERY_KEY = ["notificationReadState"];

// Generic per-account "last seen at" primitive — server-authoritative (see
// notification_read_state in the database), not on-device, so it persists
// across reinstalls and stays correct if the same account signs into a
// second device. AuthContext clears this query on sign-out so a
// newly-logged-in account never briefly sees the previous account's cached
// watermark before its own fetch resolves.
export function useLastSeenTracker(trackerKey) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATION_READ_STATE_QUERY_KEY,
    queryFn: getNotificationReadState,
    enabled: !!user,
    staleTime: 60_000,
  });

  const lastSeenAt = data?.state?.[trackerKey] ?? null;

  const markSeen = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    // Patch the cache first so the badge clears instantly, without waiting
    // on the network round-trip; the POST persists it server-side right after.
    queryClient.setQueryData(NOTIFICATION_READ_STATE_QUERY_KEY, (prev) => ({
      state: { ...(prev?.state ?? {}), [trackerKey]: now },
    }));
    await markNotificationSeen(trackerKey);
  }, [user, trackerKey, queryClient]);

  return { lastSeenAt, isLoading, markSeen };
}

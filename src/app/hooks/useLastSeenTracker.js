import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  getNotificationReadState,
  markNotificationSeen,
} from "../services/notificationReadStateApi";

export const NOTIFICATION_READ_STATE_QUERY_KEY = ["notificationReadState"];

export function useLastSeenTracker(trackerKey) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATION_READ_STATE_QUERY_KEY,
    queryFn: getNotificationReadState,
    enabled: Boolean(profile),
    staleTime: 60_000,
  });

  const markSeen = useCallback(async () => {
    if (!profile) return;

    const previous = queryClient.getQueryData(NOTIFICATION_READ_STATE_QUERY_KEY);
    const lastSeenAt = new Date().toISOString();
    queryClient.setQueryData(NOTIFICATION_READ_STATE_QUERY_KEY, (current) => ({
      ...(current ?? {}),
      state: {
        ...(current?.state ?? {}),
        [trackerKey]: lastSeenAt,
      },
    }));

    try {
      const result = await markNotificationSeen(trackerKey);
      queryClient.setQueryData(NOTIFICATION_READ_STATE_QUERY_KEY, (current) => ({
        ...(current ?? {}),
        state: {
          ...(current?.state ?? {}),
          [trackerKey]: result.lastSeenAt,
        },
      }));
    } catch (error) {
      queryClient.setQueryData(NOTIFICATION_READ_STATE_QUERY_KEY, previous);
      throw error;
    }
  }, [profile, queryClient, trackerKey]);

  return {
    lastSeenAt: data?.state?.[trackerKey] ?? null,
    loading: isLoading,
    markSeen,
  };
}

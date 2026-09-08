import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements } from "../services/announcementsApi";

export const ANNOUNCEMENTS_QUERY_KEY = ["announcements"];

export function useAnnouncements() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ANNOUNCEMENTS_QUERY_KEY,
    queryFn: getAnnouncements,
    staleTime: 60_000,
  });

  function setAnnouncements(next) {
    queryClient.setQueryData(ANNOUNCEMENTS_QUERY_KEY, (prev) =>
      typeof next === "function" ? next(prev ?? []) : next,
    );
  }

  return {
    announcements: data ?? [],
    setAnnouncements,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

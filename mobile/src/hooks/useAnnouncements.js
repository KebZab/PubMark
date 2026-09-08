import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "../services/api";

export const ANNOUNCEMENTS_QUERY_KEY = ["announcements"];

export function useAnnouncements() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ANNOUNCEMENTS_QUERY_KEY,
    queryFn: getAnnouncements,
    staleTime: 60_000,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

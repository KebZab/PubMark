import { useQuery } from "@tanstack/react-query";
import { getNotices } from "../services/announcementsApi";

export const NOTICES_QUERY_KEY = ["notices"];

export function useNotices() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: NOTICES_QUERY_KEY,
    queryFn: getNotices,
    staleTime: 60_000,
  });

  return {
    notices: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

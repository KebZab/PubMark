import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStalls } from "../services/stallsApi";

export const STALLS_QUERY_KEY = ["stalls"];

export function useStalls() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: STALLS_QUERY_KEY,
    queryFn: getStalls,
    // Stall geometry/metadata rarely changes minute-to-minute.
    staleTime: 5 * 60_000,
  });

  // Preserves the old useState-setter shape (including functional updaters)
  // for callers that patch the cached list directly instead of refetching.
  function setStalls(next) {
    queryClient.setQueryData(STALLS_QUERY_KEY, (prev) =>
      typeof next === "function" ? next(prev ?? []) : next,
    );
  }

  return {
    stalls: data ?? [],
    setStalls,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

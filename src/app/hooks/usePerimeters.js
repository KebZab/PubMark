import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPerimeters } from "../services/perimeterApi";

export const PERIMETERS_QUERY_KEY = ["perimeters"];

export function usePerimeters() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: PERIMETERS_QUERY_KEY,
    queryFn: getPerimeters,
    // The market boundary essentially never changes during normal use.
    staleTime: 5 * 60_000,
  });

  function setPerimeters(next) {
    queryClient.setQueryData(PERIMETERS_QUERY_KEY, (prev) =>
      typeof next === "function" ? next(prev ?? []) : next,
    );
  }

  return {
    perimeters: data ?? [],
    setPerimeters,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

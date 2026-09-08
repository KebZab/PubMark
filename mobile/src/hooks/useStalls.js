import { useQuery } from "@tanstack/react-query";
import { getStalls } from "../services/api";

export const STALLS_QUERY_KEY = ["stalls"];

// Shared across every screen that needs the stall list (map screens,
// violations, receipts) so they share one cached fetch instead of each
// hitting the network independently.
export function useStalls() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: STALLS_QUERY_KEY,
    queryFn: getStalls,
    // Stall geometry/metadata rarely changes minute-to-minute.
    staleTime: 5 * 60_000,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

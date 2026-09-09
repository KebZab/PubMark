import { useQuery } from "@tanstack/react-query";
import { getTransfers } from "../services/api";

export const TRANSFERS_QUERY_KEY = ["transfers"];

// Short staleTime -- an incoming transfer offer is actionable workflow data
// (like receipts on the web side), not slow-changing content like announcements.
export function useTransfers() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: TRANSFERS_QUERY_KEY,
    queryFn: getTransfers,
    staleTime: 15_000,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

import { useQuery } from "@tanstack/react-query";
import { getApplications } from "../services/api";

export const APPLICATIONS_QUERY_KEY = ["applications"];

export function useApplications() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: APPLICATIONS_QUERY_KEY,
    queryFn: getApplications,
    // Workflow data (statuses change via admin/vendor action often) — kept
    // short so a screen left open doesn't show a stale status for long.
    staleTime: 15_000,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

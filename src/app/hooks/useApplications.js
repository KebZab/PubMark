import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplications } from "../services/applicationsApi";

export const APPLICATIONS_QUERY_KEY = ["applications"];

export function useApplications() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: APPLICATIONS_QUERY_KEY,
    queryFn: getApplications,
    // Workflow data (statuses change via admin/vendor action often) — kept
    // short so a screen left open doesn't show a stale status for long.
    staleTime: 15_000,
  });

  function setApplications(next) {
    queryClient.setQueryData(APPLICATIONS_QUERY_KEY, (prev) =>
      typeof next === "function" ? next(prev ?? []) : next,
    );
  }

  return {
    applications: data ?? [],
    setApplications,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

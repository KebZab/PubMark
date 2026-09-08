import { useQuery } from "@tanstack/react-query";
import { getMapFacilities } from "../services/api";

export const MAP_FACILITIES_QUERY_KEY = ["mapFacilities"];

// Mobile always fetches every floor's facilities at once (screens filter by
// floor client-side), unlike the web app's per-floor query — matches the
// existing getMapFacilities() call pattern already used across screens.
export function useMapFacilities() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: MAP_FACILITIES_QUERY_KEY,
    queryFn: () => getMapFacilities(),
    // Entrances/CRs/stairs/office markers essentially never move day-to-day.
    staleTime: 5 * 60_000,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

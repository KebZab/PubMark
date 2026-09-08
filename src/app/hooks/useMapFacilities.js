import { useQuery } from "@tanstack/react-query";
import { getMapFacilities } from "../services/mapFacilitiesApi";

export function mapFacilitiesQueryKey(floor) {
  return ["mapFacilities", floor];
}

export function useMapFacilities(floor) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: mapFacilitiesQueryKey(floor),
    queryFn: () => getMapFacilities(floor),
    // Entrances/CRs/stairs/office markers essentially never move day-to-day.
    staleTime: 5 * 60_000,
  });

  return {
    facilities: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

import { useCallback, useEffect, useState } from "react";
import { getMapFacilities } from "../services/mapFacilitiesApi";

export function useMapFacilities(floor) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setFacilities(await getMapFacilities(floor));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [floor]);

  useEffect(() => { refetch(); }, [refetch]);
  return { facilities, loading, error, refetch };
}


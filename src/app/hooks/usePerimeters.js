import { useCallback, useEffect, useState } from "react";
import { getPerimeters } from "../services/perimeterApi";

export function usePerimeters() {
  const [perimeters, setPerimeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setPerimeters(await getPerimeters());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { perimeters, setPerimeters, loading, error, refetch };
}

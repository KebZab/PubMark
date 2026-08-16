import { useCallback, useEffect, useState } from "react";
import { getPerimeters, type Perimeter } from "../services/perimeterApi";

export function usePerimeters() {
  const [perimeters, setPerimeters] = useState<Perimeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setPerimeters(await getPerimeters());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { perimeters, setPerimeters, loading, error, refetch };
}

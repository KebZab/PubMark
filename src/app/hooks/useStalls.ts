import { useCallback, useEffect, useState } from "react";
import { getStalls, type Stall } from "../services/stallsApi";

export function useStalls() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setStalls(await getStalls());
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

  return { stalls, setStalls, loading, error, refetch };
}

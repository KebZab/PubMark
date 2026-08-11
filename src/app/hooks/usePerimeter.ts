import { useCallback, useEffect, useState } from "react";
import { getPerimeter, type Perimeter } from "../services/perimeterApi";

export function usePerimeter() {
  const [perimeter, setPerimeter] = useState<Perimeter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setPerimeter(await getPerimeter());
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

  return { perimeter, setPerimeter, loading, error, refetch };
}

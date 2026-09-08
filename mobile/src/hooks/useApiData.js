import { useCallback, useEffect, useRef, useState } from "react";

// Small fetch-with-state helper, equivalent to the web app's useApplications /
// useStalls hooks. Tracks loading separately from "empty" so screens can avoid
// flashing an empty state before data arrives — a bug we hit on the web side.
export function useApiData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(false);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  const load = useCallback(async () => {
    if (!mounted.current) return;
    const id = ++requestId.current;
    const isCurrent = () => mounted.current && id === requestId.current;
    setError(null);
    try {
      const result = await stableFetcher();
      if (isCurrent()) setData(result);
    } catch (e) {
      if (isCurrent()) setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [stableFetcher]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    void load();
    return () => {
      mounted.current = false;
      // Invalidate both initial loads and manual refreshes on cleanup.
      requestId.current++;
    };
  }, [load]);

  // For pull-to-refresh: refetch without flipping back to the loading state.
  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return { data, loading, error, refetch };
}

import { useCallback, useEffect, useState } from "react";

// Small fetch-with-state helper, equivalent to the web app's useApplications /
// useStalls hooks. Tracks loading separately from "empty" so screens can avoid
// flashing an empty state before data arrives — a bug we hit on the web side.
export function useApiData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await stableFetcher());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [stableFetcher]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await stableFetcher();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stableFetcher]);

  // For pull-to-refresh: refetch without flipping back to the loading state.
  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return { data, loading, error, refetch };
}

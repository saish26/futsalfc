import { useCallback, useEffect, useRef, useState } from "react";

interface ApiState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface Result<T> {
  key: string;
  data: T | undefined;
  error: string | null;
}

/**
 * Runs `fetcher` on mount and whenever `deps` change.
 * Pass `enabled: false` to wait (e.g. until router.query is ready).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], enabled = true): ApiState<T> {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<Result<T>>({ key: "", data: undefined, error: null });
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // A request is identified by its deps + reload counter; loading is simply "latest result is for an older key".
  const key = JSON.stringify([tick, ...deps]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((err) =>
        !cancelled &&
        setResult({ key, data: undefined, error: typeof err === "string" && err ? err : "Something went wrong" })
      );
    return () => {
      cancelled = true;
    };
  }, [enabled, key]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = result.key === key;

  return {
    data: result.data,
    loading: enabled && !current,
    error: current ? result.error : null,
    reload,
  };
}

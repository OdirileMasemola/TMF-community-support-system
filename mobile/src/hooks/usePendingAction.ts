import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps an async handler so a button can show a spinner while it runs.
 * Ignores repeat presses while the first one is still in progress.
 */
export function usePendingAction<Args extends unknown[]>(action: (...args: Args) => Promise<unknown> | unknown) {
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: Args) => {
      if (running.current) return;
      running.current = true;
      setPending(true);
      try {
        await action(...args);
      } finally {
        running.current = false;
        if (mounted.current) setPending(false);
      }
    },
    [action],
  );

  return [run, pending] as const;
}

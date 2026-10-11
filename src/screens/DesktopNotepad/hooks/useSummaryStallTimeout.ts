import { useEffect, useState } from "react";

/**
 * True once `active` has stayed true for `delayMs`. Bounds the summary loading
 * states so they can't hang forever when the backend never settles the status.
 */
export function useSummaryStallTimeout(
  active: boolean,
  delayMs: number,
): boolean {
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (!active) {
      setStalled(false);
      return;
    }
    const timeout = setTimeout(() => setStalled(true), delayMs);
    return () => clearTimeout(timeout);
  }, [active, delayMs]);

  return stalled;
}

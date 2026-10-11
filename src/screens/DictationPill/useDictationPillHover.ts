import { useState } from "react";
import { resolveStaleHover } from "./dictationPillHover";

/**
 * The main process's hover flag, minus the hover a landed session inherited.
 * Derived during render so the launcher never opens for even a frame on the
 * render the settle lets go.
 */
export function useDictationPillHover(
  isHovered: boolean,
  settling: boolean,
): boolean {
  const [stale, setStale] = useState(false);
  const next = resolveStaleHover(stale, isHovered, settling);
  if (next !== stale) setStale(next);
  return isHovered && !next;
}

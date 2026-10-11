import type { DictationPillSide } from "electron/src/types";
import { useEffect, useState } from "react";

/**
 * Which screen edge the floating live bar is docked to. The main process owns
 * the value: the bar opens on the top edge and the value follows every drag
 * that snaps it to another edge. Until the first answer arrives the bar lays
 * out for the top edge, where it opens, so the first frame does not flash at
 * the bottom of the window.
 */
export function useLiveBarDockSide(): {
  side: DictationPillSide;
  resolved: boolean;
} {
  const [side, setSide] = useState<DictationPillSide | null>(null);

  useEffect(() => {
    const cleanup = window.electron?.liveView?.onBarSide?.(setSide);
    void window.electron?.liveView?.getBarSide?.().then((next) => {
      if (next) setSide(next);
    });
    return () => cleanup?.();
  }, []);

  return { side: side ?? "top", resolved: side !== null };
}

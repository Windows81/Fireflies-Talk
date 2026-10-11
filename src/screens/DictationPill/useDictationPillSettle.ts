import type { DictationState } from "electron/src/types";
import { useEffect, useState } from "react";
import type { DictationPillMode } from "./dictationPillMode";
import {
  resolveDictationPillSettling,
  SETTLE_HOLD_MS,
  type DictationPillMoment,
} from "./dictationPillSettle";

type Seen = DictationPillMoment & { settling: boolean };

/**
 * True while a finished session comes home — from the render the pill first
 * rests until the embers have surfaced and dimmed — so the shell, the embers,
 * the mark and the meter all play the one gesture together.
 *
 * Derived during render, not in an effect, so the very first resting render
 * already moves at settle pace instead of snapping toward the nub and then
 * changing its mind a frame later.
 */
export function useDictationPillSettle(
  mode: DictationPillMode,
  state: DictationState,
): boolean {
  const [seen, setSeen] = useState<Seen>({ mode, state, settling: false });

  let current = seen;
  if (seen.mode !== mode || seen.state !== state) {
    const next = { mode, state };
    current = {
      ...next,
      settling: resolveDictationPillSettling(seen, next, seen.settling),
    };
    setSeen(current);
  }
  const { settling } = current;

  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(
      () => setSeen((latest) => ({ ...latest, settling: false })),
      SETTLE_HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [settling]);

  return settling;
}

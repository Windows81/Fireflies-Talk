import type { SpeakerSourceState } from "electron/src/types";
import { useEffect, useState } from "react";

/**
 * Live meeting speaker state from the desktop app, or `null` until the
 * first update arrives or while `enabled` is false.
 */
export function useSpeakerSourceState(
  enabled = true,
): SpeakerSourceState | null {
  const [state, setState] = useState<SpeakerSourceState | null>(null);

  useEffect(() => {
    if (!enabled) {
      setState(null);
      return;
    }
    return window.electron?.speakerSource.watch(setState);
  }, [enabled]);

  return state;
}

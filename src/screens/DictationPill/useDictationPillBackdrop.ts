import type { DictationPillBackdrop } from "electron/src/types";
import { useEffect, useState } from "react";

/**
 * What the pill floats over, as the main process reads it off the screen
 * about once a second. Dark until told otherwise: that is the look the pill
 * was designed against, and what it keeps where sampling is unavailable.
 */
export function useDictationPillBackdrop(): DictationPillBackdrop {
  const [backdrop, setBackdrop] = useState<DictationPillBackdrop>("dark");
  useEffect(() => {
    const dictation = window.electron?.dictation;
    // The main process only pushes changes, so a pill that (re)loads after
    // the last one pulls the current call rather than waiting for the next.
    void dictation?.getPillBackdrop?.().then((current) => {
      if (current) setBackdrop(current);
    });
    return dictation?.onPillBackdrop?.(setBackdrop);
  }, []);
  return backdrop;
}

import {
  DICTATION_AUTO_STOP_WARNING_SECONDS,
  remainingDictationSeconds,
} from "@/hooks/dictationAutoStop";
import { readArmedDictationMaxSeconds } from "@/hooks/dictationArmedCap";
import { useEffect, useState } from "react";

export function useDictationAutoStopRemaining(
  recording: boolean,
): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!recording) {
      setRemaining(null);
      return;
    }

    const startedAt = Date.now();
    const cap = readArmedDictationMaxSeconds();
    const tick = () => {
      const seconds = remainingDictationSeconds(Date.now() - startedAt, cap);
      setRemaining(
        seconds <= DICTATION_AUTO_STOP_WARNING_SECONDS ? seconds : null,
      );
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [recording]);

  return remaining;
}

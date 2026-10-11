import type {
  DictationEmailAssistantProvider,
  DictationPillSide,
} from "electron/src/types";
import { useEffect, useState } from "react";

interface EmailAssistantCardSnapshot {
  side: DictationPillSide;
  /** Null until the main process answers; the card has no label without it. */
  provider: DictationEmailAssistantProvider | null;
}

/**
 * What the card window needs from the main process: the side of the pill it
 * hangs off, and the provider the main window asked it to offer. The window
 * is created fresh for every showing, so one pull on mount is enough.
 */
export function useDictationEmailAssistantCard(): EmailAssistantCardSnapshot {
  const [side, setSide] = useState<DictationPillSide>("bottom");

  const [provider, setProvider] =
    useState<DictationEmailAssistantProvider | null>(null);

  useEffect(() => {
    const dictation = window.electron?.dictation;

    void dictation?.getSide?.().then((next) => {
      if (next) setSide(next);
    });

    void dictation?.getEmailAssistantNudgeProvider?.().then(setProvider);
    return dictation?.onSide(setSide);
  }, []);

  return { side, provider };
}

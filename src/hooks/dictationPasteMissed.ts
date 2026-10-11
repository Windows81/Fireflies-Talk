import { setDictationPasteResult } from "./dictationHistory";

/** Comfortably longer than the main process takes to read the target again. */
const PASTE_MISSED_WINDOW_MS = 2_000;

/**
 * A paste whose target could not be judged at the keystroke is reported as
 * pasted at once and read again afterwards. When that finds nothing could
 * take the text, its history entry stops counting as inserted.
 */
export function unmarkPastedWhenMissed(
  pasteEpoch: number,
  entryId: string,
  subscribe = window.electron!.dictation.onPasteMissed,
): void {
  const stop = () => {
    clearTimeout(timer);
    unsubscribe();
  };
  const unsubscribe = subscribe((missedEpoch) => {
    if (missedEpoch !== pasteEpoch) return;
    setDictationPasteResult({ id: entryId, pasted: false });
    stop();
  });
  const timer = setTimeout(stop, PASTE_MISSED_WINDOW_MS);
}

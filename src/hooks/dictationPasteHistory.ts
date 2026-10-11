import type { DictationEntry } from "./dictationHistoryEntries";

export type PasteHistoryResult = {
  success: boolean;
  skipped?: boolean;
  copiedToClipboard?: boolean;
};

/**
 * A paste that fell back to the clipboard is kept in history but not marked
 * as inserted: nothing received the text, the user still has to paste it.
 */
export const historyEntryAfterPaste = (
  pasteResult: PasteHistoryResult,
  entry: Omit<DictationEntry, "pasted">,
): DictationEntry | null => {
  if (pasteResult.skipped) return null;
  return {
    ...entry,
    pasted: pasteResult.success && !pasteResult.copiedToClipboard,
  };
};

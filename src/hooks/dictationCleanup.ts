import { formatDictationText } from "./dictationApi";
import type { FormatDictationPayload } from "./dictationFormatDto";

export type DictationCleanupResult = {
  text: string;
  /** Cleanup failed or came back empty, so `text` is the raw transcript. */
  fallback: boolean;
  serverMs?: number;
};

/**
 * Cleans a raw dictation transcript via dictation-ff (`POST /api/dictation/format`).
 * On failure, returns the raw text so dictation never blocks.
 */
export async function cleanupDictationText(
  rawText: string,
  options: Omit<FormatDictationPayload, "rawText"> = {},
): Promise<DictationCleanupResult> {
  try {
    const { cleanedText, serverMs } = await formatDictationText(
      rawText,
      options,
    );
    if (!cleanedText) {
      window.electron?.logger.write(
        "error",
        "dictationCleanup",
        "Server cleanup returned empty text; pasting raw transcript",
      );
      return { text: rawText, fallback: true, serverMs };
    }
    return { text: cleanedText, fallback: false, serverMs };
  } catch (error) {
    window.electron?.logger.write(
      "error",
      "dictationCleanup",
      `Server cleanup request failed (${String(error)}); pasting raw transcript`,
    );
    return { text: rawText, fallback: true };
  }
}

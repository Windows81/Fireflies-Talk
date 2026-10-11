import { DEFAULT_DICTATION_LANGUAGE_HINTS } from "./dictationLanguages";

const lastSelected = { hints: DEFAULT_DICTATION_LANGUAGE_HINTS };

/** Session memory for the last explicit picks. Empty stored hints mean auto-detect. */
export function takeLastDictationLanguageHints(stored: string[]): string[] {
  if (stored.length > 0) lastSelected.hints = stored;
  return lastSelected.hints;
}

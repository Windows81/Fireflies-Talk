import { toDayKey } from "./dictationDayClock";
import {
  countSpokenWords,
  type DictationEntry,
} from "./dictationHistoryEntries";

/**
 * Spoken words per day key, from the retained history. A day whose entries
 * have all been evicted by the history cap has no key here, so a caller can
 * tell "nothing left to count" apart from a genuine zero.
 */
export const getWordsByDay = (
  entries: DictationEntry[],
): Map<string, number> => {
  const words = new Map<string, number>();
  for (const entry of entries) {
    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = toDayKey(date);
    words.set(key, (words.get(key) ?? 0) + countSpokenWords(entry));
  }
  return words;
};

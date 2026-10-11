import { takeLastDictationLanguageHints } from "./lastDictationLanguageHints";
import { useLocalSettings } from "./useLocalSettings";

export interface DictationLanguageHints {
  /** The languages to show as picked, even while auto-detect is on. */
  selected: string[];
  autoDetect: boolean;
  setSelected: (codes: string[]) => void;
  setAutoDetect: (enabled: boolean) => void;
}

/**
 * Stored hints double as the auto-detect flag: an empty list means detect the
 * language while speaking. The last explicit picks are held onto so turning
 * auto-detect back off restores them instead of resetting to English.
 */
export function useDictationLanguageHints(): DictationLanguageHints {
  const { dictationLanguageHints, setDictationLanguageHints } =
    useLocalSettings();

  const selected = takeLastDictationLanguageHints(dictationLanguageHints);

  const setAutoDetect = (enabled: boolean) => {
    setDictationLanguageHints(enabled ? [] : selected);
  };

  return {
    selected,
    autoDetect: dictationLanguageHints.length === 0,
    setSelected: setDictationLanguageHints,
    setAutoDetect,
  };
}

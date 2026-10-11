import { nextMultiSelectValues } from "../../../components/Input/selectMulti";
import {
  DEFAULT_DICTATION_LANGUAGE_HINTS,
  MAX_DICTATION_LANGUAGE_HINTS,
  toDictationLanguageHint,
} from "../../../features/settings/dictationLanguages";

/** Next stored hints after a language-row tap. Undefined means the tap is a no-op. */
export function nextLanguageHintSelection(
  selected: string[],
  code: string,
  autoDetect: boolean,
): string[] | undefined {
  if (autoDetect && selected.includes(code)) return selected;

  const next = nextMultiSelectValues(
    selected,
    code,
    MAX_DICTATION_LANGUAGE_HINTS,
  );

  if (next?.length) return next;
  if (autoDetect) return [code];
  return undefined;
}

/**
 * Hints to store when the language step first opens. Only the untouched
 * default is replaced, by the account language when dictation supports it.
 * Undefined keeps what is stored — English for `auto` and unset accounts.
 */
export function prefillLanguageHints(
  stored: string[],
  accountLanguage: string | undefined,
): string[] | undefined {
  const hint = toDictationLanguageHint(accountLanguage);
  if (!hint || DEFAULT_DICTATION_LANGUAGE_HINTS.includes(hint)) {
    return undefined;
  }

  const untouched =
    stored.length === DEFAULT_DICTATION_LANGUAGE_HINTS.length &&
    stored.every((code, i) => code === DEFAULT_DICTATION_LANGUAGE_HINTS[i]);
  return untouched ? [hint] : undefined;
}

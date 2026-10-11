import {
  chordRecordFallsBackToDefault,
  formatDictationBindingLabel,
  isStandaloneModifierBinding,
  macVirtualKeyForToken,
  normalizeDictationBinding,
  nullableBindingsEqual,
  usesDarwinFnBinding,
  validateCapturedBinding,
  type DictationBinding,
} from "./dictation-binding";
import { sharesChordTarget } from "./macos-shared-chord";
import { shortcutAlreadyInUse } from "./shortcut-conflict";
import {
  isStandaloneModifierAllowed,
  standaloneModifierError,
} from "./standalone-modifier-policy";
import type { PolishBinding } from "./polish-binding";

export const HANDS_FREE_SHARED_KEY_ERROR =
  "Use keys that aren't part of your dictation and action shortcuts.";
export const HANDS_FREE_DICTATION_SHARED_KEY_ERROR =
  "Use keys that aren't part of your hands-free shortcut.";
export const HANDS_FREE_FN_TAKEN_ERROR =
  "Push to talk already uses Fn. Pick a different key or combination.";

// Hands-free is intentionally unassigned on every platform.
export const defaultHandsFreeBinding = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _platform: string,
): DictationBinding | null => null;

export const normalizeHandsFreeBinding = (
  value: unknown,
  platform: string,
): DictationBinding | null => {
  if (value == null) return null;
  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.type === "darwin-fn") {
    const bareFn =
      record.key === undefined &&
      !(Array.isArray(record.modifiers) && record.modifiers.length > 0);
    return platform === "darwin" && bareFn ? { type: "darwin-fn" } : null;
  }
  if (record.type !== "chord") return null;
  if (chordRecordFallsBackToDefault(record, platform)) return null;
  const normalized = normalizeDictationBinding(value, platform);
  if (
    normalized.type === "chord" &&
    isStandaloneModifierBinding(normalized) &&
    !isStandaloneModifierAllowed(normalized.modifiers[0], platform)
  ) {
    return null;
  }
  return normalized;
};

/**
 * The recorder reports Fn + Space as an Fn binding. Hands-free runs on a chord
 * helper rather than the Fn listener, so it keeps Fn + key as a chord.
 */
export const handsFreeBindingFromCapture = (
  binding: DictationBinding,
): DictationBinding =>
  binding.type === "darwin-fn" && binding.key && !binding.modifiers?.length
    ? { fn: true, key: binding.key, modifiers: [], type: "chord" }
    : binding;

/** Mac virtual key of an Fn + key hands-free shortcut, for the Fn listener. */
export const handsFreeFnKeyCode = (
  binding: DictationBinding | null,
): number | null =>
  binding?.type === "chord" && binding.fn && binding.key
    ? (macVirtualKeyForToken(binding.key) ?? null)
    : null;

/**
 * One native listener watches Fn, so Fn on its own is only free for hands-free
 * while push to talk does not use Fn.
 */
export const handsFreeFnTaken = (
  handsFree: DictationBinding | null,
  dictation: DictationBinding,
): boolean =>
  handsFree !== null &&
  usesDarwinFnBinding(handsFree) &&
  dictation.type === "darwin-fn";

export const validateHandsFreeCapture = (
  binding: DictationBinding,
  platform: string,
  dictation: DictationBinding,
): string | null => {
  if (handsFreeFnTaken(binding, dictation)) {
    return HANDS_FREE_FN_TAKEN_ERROR;
  }
  if (usesDarwinFnBinding(binding)) return null;
  if (binding.type === "darwin-fn") {
    return "Hold Fn and press a letter, number, or Space, such as Fn + Space.";
  }
  // Recording checked Fn + key as an Fn shortcut. As a chord, Fn with a
  // function key would also fire on the bare key.
  if (binding.fn) return validateCapturedBinding(binding, platform);
  if (
    binding.type === "chord" &&
    isStandaloneModifierBinding(binding) &&
    !isStandaloneModifierAllowed(binding.modifiers[0], platform)
  ) {
    return standaloneModifierError(binding.modifiers[0], platform);
  }
  return null;
};

const standaloneModifierInChord = (
  standalone: DictationBinding,
  chord: DictationBinding,
): boolean => {
  if (chord.type !== "chord" || !isStandaloneModifierBinding(standalone)) {
    return false;
  }
  if (isStandaloneModifierBinding(chord)) {
    return shortcutAlreadyInUse(standalone, chord);
  }
  const modifier =
    standalone.type === "chord" ? standalone.modifiers[0] : undefined;
  return modifier !== undefined && chord.modifiers.includes(modifier);
};

export const handsFreeOverlaps = (
  a: DictationBinding,
  b: DictationBinding | null,
): boolean =>
  b !== null &&
  (sharesChordTarget(a, b) ||
    standaloneModifierInChord(a, b) ||
    standaloneModifierInChord(b, a));

export const handsFreeSharesKey = (
  candidate: DictationBinding,
  dictation: DictationBinding,
  action: DictationBinding | null,
): boolean =>
  handsFreeOverlaps(candidate, dictation) ||
  handsFreeOverlaps(candidate, action);

export const resolvePersistedHandsFreeBinding = (
  stored: unknown,
  dictation: DictationBinding,
  action: DictationBinding | null,
  polish: PolishBinding | null,
  platform: string,
): DictationBinding | null => {
  const binding = normalizeHandsFreeBinding(stored, platform);
  if (!binding) return null;
  if (
    shortcutAlreadyInUse(binding, dictation) ||
    shortcutAlreadyInUse(binding, action) ||
    shortcutAlreadyInUse(binding, polish) ||
    handsFreeSharesKey(binding, dictation, action) ||
    handsFreeFnTaken(binding, dictation)
  ) {
    return null;
  }
  return binding;
};

export const handsFreeBindingsEqual = nullableBindingsEqual;

export const formatHandsFreeBindingLabel = (
  binding: DictationBinding | null,
  options: { isMac: boolean },
): string =>
  binding ? formatDictationBindingLabel(binding, options) : "Unassigned";

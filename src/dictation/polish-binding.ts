import {
  dictationBindingsEqual,
  formatDictationBindingLabel,
  keyTokenFromMacVirtualKey,
  macVirtualKeyForToken,
  normalizeDictationBinding,
  normalizeKeyToken,
  validateCapturedBinding,
  type DictationBinding,
} from "./dictation-binding";
import { sharesChordTarget } from "./macos-shared-chord";

type FnPolishBinding = Extract<DictationBinding, { type: "darwin-fn" }> & {
  /** Default Fn+1 also answers to F1 on function-row keyboards. */
  functionRowAlias?: boolean;
};

/**
 * Polish is an Fn chord read by the native Globe listener, or a modifier chord
 * such as Ctrl + Shift + P run by its own chord helper. macOS only.
 */
export type PolishBinding =
  | FnPolishBinding
  | Extract<DictationBinding, { type: "chord" }>;

export const POLISH_SHARED_KEY_ERROR =
  "That key is already part of another Talk shortcut. Pick a different key.";
export const SHARES_POLISH_KEY_ERROR =
  "That key is already part of your polish shortcut. Pick a different key.";

/** Fn + 1. */
export const defaultPolishBinding = (platform: string): PolishBinding | null =>
  platform === "darwin"
    ? { functionRowAlias: true, key: "1", type: "darwin-fn" }
    : null;

const hasFunctionRowAlias = (binding: DictationBinding): boolean =>
  binding.type === "darwin-fn" &&
  Boolean((binding as FnPolishBinding).functionRowAlias);

export const polishBindingsEqual = (
  left: PolishBinding | null,
  right: PolishBinding | null,
): boolean => {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    dictationBindingsEqual(left, right) &&
    hasFunctionRowAlias(left) === hasFunctionRowAlias(right)
  );
};

/**
 * On a function-row keyboard the "1" key reports F1 (0x7a) instead of 1 (0x12)
 * depending on the "Use F1, F2 as standard function keys" setting, so the
 * default binding answers to both. A recorded binding answers to exactly the
 * key that was recorded.
 */
const DEFAULT_ALIAS_KEYS = ["1", "F1"];

const normalizeFnPolish = (
  record: Record<string, unknown>,
): PolishBinding | null => {
  const key = normalizeKeyToken(record.key);
  // Bare Fn is hold-to-dictate, never a polish trigger.
  if (!key) return null;
  if (macVirtualKeyForToken(key) === undefined) return null;
  const binding: FnPolishBinding = { key, type: "darwin-fn" };
  if (record.functionRowAlias === true) binding.functionRowAlias = true;
  return binding;
};

/**
 * Polish fires the moment its chord goes down, so it needs a key or a side
 * mouse button. Modifiers alone would fire partway through Ctrl + Shift + T.
 * Fn stays on the Globe listener as an Fn chord, never a chord helper flag.
 */
const isUsablePolishChord = (binding: DictationBinding): boolean =>
  binding.type === "chord" &&
  !binding.fn &&
  (binding.key !== undefined || binding.mouseButton !== undefined);

export const normalizePolishBinding = (
  value: unknown,
  platform: string,
): PolishBinding | null => {
  if (platform !== "darwin") return null;
  if (value === undefined) return defaultPolishBinding(platform);
  if (value == null) return null;
  if (typeof value !== "object") return defaultPolishBinding(platform);

  const record = value as Record<string, unknown>;
  if (record.type === "unassigned") return null;
  if (record.type === "darwin-fn") return normalizeFnPolish(record);

  // A stored chord must pass the same checks as a recorded one, or a hand-edited
  // or stale value could bind polish to a bare key and swallow it everywhere.
  const chord = normalizeDictationBinding(value, platform);
  if (chord.type !== "chord" || validatePolishCapture(chord)) {
    return defaultPolishBinding(platform);
  }
  return chord;
};

export const formatPolishBindingLabel = (
  binding: PolishBinding | null,
): string =>
  binding
    ? formatDictationBindingLabel(binding, { isMac: true })
    : "Unassigned";

/** Virtual key codes the native Fn listener should treat as polish. */
export const polishMacVirtualKeys = (
  binding: PolishBinding | null,
): number[] => {
  if (binding?.type !== "darwin-fn" || !binding.key) return [];
  const keys = binding.functionRowAlias ? DEFAULT_ALIAS_KEYS : [binding.key];
  const codes: number[] = [];
  for (const key of keys) {
    const code = macVirtualKeyForToken(key);
    if (code !== undefined && !codes.includes(code)) codes.push(code);
  }
  return codes;
};

/** Builds a polish binding from a virtual key code the listener captured. */
export const polishBindingFromMacVirtualKey = (
  code: number,
): PolishBinding | null => {
  const key = keyTokenFromMacVirtualKey(code);
  return key ? { key, type: "darwin-fn" } : null;
};

/** Shift plus a letter, digit, Space or backquote is just typing. */
const isShiftOnlyTyping = (
  binding: Extract<DictationBinding, { type: "chord" }>,
): boolean =>
  binding.modifiers.length === 1 &&
  binding.modifiers[0] === "shift" &&
  binding.key !== undefined &&
  !/^F([1-9]|1[0-2])$/.test(binding.key);

const POLISH_NEEDS_KEY_ERROR =
  "Polish needs a key. Try Fn + 1, or a combination like Ctrl + Shift + P.";

/**
 * Checks a freshly captured shortcut. Takes the raw binding rather than a
 * normalized one: normalizePolishBinding falls back to the default for
 * anything unusable, which would turn a rejected chord into a silent save.
 */
export const validatePolishCapture = (
  binding: DictationBinding,
): string | null => {
  if (binding.type === "chord") {
    if (binding.fn) {
      return "To use Fn, hold Fn and press one key, such as Fn + 1.";
    }
    if (!isUsablePolishChord(binding)) return POLISH_NEEDS_KEY_ERROR;
    // Polish fires the moment its chord goes down, so this would fire mid-word.
    if (isShiftOnlyTyping(binding)) {
      return "Shift on its own types capitals. Add Ctrl, Option, or Cmd, such as Ctrl + Shift + P.";
    }
    return validateCapturedBinding(binding, "darwin");
  }
  if (!binding.key || binding.modifiers?.length) return POLISH_NEEDS_KEY_ERROR;
  if (macVirtualKeyForToken(binding.key) === undefined) {
    return "That key can't be used with Fn. Try a letter, a number, or F1–F12.";
  }
  return null;
};

/**
 * A polish chord runs on its own helper, which swallows its key. Another chord
 * on the same key or mouse button would compete with it for every press.
 */
export const polishSharesKey = (
  polish: DictationBinding | null,
  other: DictationBinding | null,
): boolean =>
  polish !== null && other !== null && sharesChordTarget(polish, other);

/** Bindings that collide with this polish shortcut, including the F1 alias. */
export const polishConflictBindings = (
  binding: DictationBinding | null | undefined,
): DictationBinding[] => {
  if (!binding) return [];
  if (hasFunctionRowAlias(binding)) {
    return DEFAULT_ALIAS_KEYS.map((key) => ({
      key,
      type: "darwin-fn" as const,
    }));
  }
  return [binding];
};

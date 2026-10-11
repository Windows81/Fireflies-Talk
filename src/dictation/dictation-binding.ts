import {
  formatMouseLabel,
  mouseButtonCaptureError,
  normalizeMouseButton,
} from "./hotkey-mouse";
import {
  keyTokenFromMacVirtualKey,
  macVirtualKeyForToken,
} from "./macos-key-codes";
import {
  isModifierId,
  isModifierKeyId,
  modifierForPhysicalKey,
  physicalModifierLabel,
  sortModifiers,
  type ModifierId,
  type ModifierKeyId,
} from "./shortcut-modifiers";
import {
  isStandaloneModifierAllowed,
  standaloneModifierError,
} from "./standalone-modifier-policy";

export { keyTokenFromMacVirtualKey, macVirtualKeyForToken };
export type { ModifierId, ModifierKeyId };

export type DictationBinding =
  /**
   * Bare Fn holds to dictate. With `key` it is an Fn chord such as Fn + 1.
   * With `modifiers: ["shift"]` it is Fn + Shift, which starts action mode.
   */
  | { type: "darwin-fn"; key?: string; modifiers?: ModifierId[] }
  | {
      type: "chord";
      modifiers: ModifierId[];
      key?: string;
      modifierKey?: ModifierKeyId;
      mouseButton?: 4 | 5;
      /**
       * The physical Fn/Globe key is held as part of the chord. macOS only —
       * no other platform reports Fn to software. Fn on its own stays the
       * separate "darwin-fn" binding.
       */
      fn?: boolean;
    };

export interface DictationShortcutSnapshot {
  binding: DictationBinding;
  hint: string;
  label: string;
}

export const normalizeKeyToken = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[a-z]$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9]$/.test(trimmed)) return trimmed;
  if (/^F([1-9]|1[0-2])$/i.test(trimmed)) return trimmed.toUpperCase();
  if (trimmed.toLowerCase() === "space") return "Space";
  if (trimmed.toLowerCase() === "backquote") return "Backquote";
  return undefined;
};

export const defaultDictationBinding = (platform: string): DictationBinding =>
  platform === "darwin"
    ? { type: "darwin-fn" }
    : { modifiers: ["ctrl", "meta"], type: "chord" };

const normalizeChordBinding = (
  modifiers: ModifierId[],
  key?: string,
  modifierKey?: unknown,
  mouseButton?: unknown,
  fn?: boolean,
): Extract<DictationBinding, { type: "chord" }> => {
  const sorted = sortModifiers(modifiers);
  const withFn = fn ? { fn: true as const } : {};
  const normalizedMouse = normalizeMouseButton(mouseButton);
  if (normalizedMouse !== undefined) {
    return {
      modifiers: sorted,
      mouseButton: normalizedMouse,
      type: "chord",
      ...withFn,
    };
  }
  const normalizedKey = normalizeKeyToken(key);
  if (normalizedKey) {
    return { key: normalizedKey, modifiers: sorted, type: "chord", ...withFn };
  }
  if (
    isModifierKeyId(modifierKey) &&
    sorted.length === 1 &&
    sorted[0] === modifierForPhysicalKey(modifierKey)
  ) {
    return { modifierKey, modifiers: sorted, type: "chord", ...withFn };
  }
  return { modifiers: sorted, type: "chord", ...withFn };
};

const chordFallsBackToDefault = (
  chord: Extract<DictationBinding, { type: "chord" }>,
  platform: string,
): boolean => {
  const targetless = !chord.fn && !chord.key && chord.mouseButton === undefined;
  return (
    targetless &&
    (chord.modifiers.length === 0 ||
      (chord.modifiers.length === 1 &&
        (platform === "darwin"
          ? !chord.modifierKey
          : !isStandaloneModifierAllowed(chord.modifiers[0], platform))))
  );
};

export const chordRecordFallsBackToDefault = (
  record: Record<string, unknown>,
  platform: string,
): boolean => {
  if (record.type !== "chord") return false;
  if (record.modifierKey !== undefined && platform !== "darwin") return true;
  const modifiers = Array.isArray(record.modifiers)
    ? record.modifiers.filter(isModifierId)
    : [];
  const chord = normalizeChordBinding(
    modifiers,
    record.key as string,
    platform === "darwin" ? record.modifierKey : undefined,
    record.mouseButton,
    record.fn === true && platform === "darwin",
  );
  return chordFallsBackToDefault(chord, platform);
};

export const normalizeDictationBinding = (
  value: unknown,
  platform: string,
): DictationBinding => {
  if (!value || typeof value !== "object") {
    return defaultDictationBinding(platform);
  }

  const record = value as Record<string, unknown>;
  if (record.type === "darwin-fn") {
    if (platform !== "darwin") return defaultDictationBinding(platform);
    const key = normalizeKeyToken(record.key);
    return key ? { key, type: "darwin-fn" } : { type: "darwin-fn" };
  }

  if (record.type === "chord") {
    if (record.modifierKey !== undefined && platform !== "darwin") {
      return defaultDictationBinding(platform);
    }
    const modifiers = Array.isArray(record.modifiers)
      ? record.modifiers.filter(isModifierId)
      : [];
    const chord = normalizeChordBinding(
      modifiers,
      record.key as string,
      platform === "darwin" ? record.modifierKey : undefined,
      record.mouseButton,
      record.fn === true && platform === "darwin",
    );
    if (chordFallsBackToDefault(chord, platform)) {
      return defaultDictationBinding(platform);
    }
    return chord;
  }

  return defaultDictationBinding(platform);
};

export const dictationBindingsEqual = (
  left: DictationBinding,
  right: DictationBinding,
): boolean => {
  if (left.type !== right.type) return false;
  if (left.type === "darwin-fn") {
    const fn = right as typeof left;
    const leftMods = sortModifiers(left.modifiers ?? []);
    const rightMods = sortModifiers(fn.modifiers ?? []);
    return (
      left.key === fn.key &&
      leftMods.length === rightMods.length &&
      leftMods.every((modifier, i) => modifier === rightMods[i])
    );
  }
  const other = right as Extract<DictationBinding, { type: "chord" }>;
  return (
    left.key === other.key &&
    left.modifierKey === other.modifierKey &&
    left.mouseButton === other.mouseButton &&
    Boolean(left.fn) === Boolean(other.fn) &&
    sortModifiers(left.modifiers).join() ===
      sortModifiers(other.modifiers).join()
  );
};

export const nullableBindingsEqual = (
  left: DictationBinding | null,
  right: DictationBinding | null,
): boolean => {
  if (left === right) return true;
  if (!left || !right) return false;
  return dictationBindingsEqual(left, right);
};

const modifierLabels = (isMac: boolean): Record<ModifierId, string> => ({
  alt: isMac ? "Option" : "Alt",
  ctrl: "Ctrl",
  meta: isMac ? "Cmd" : "Win",
  shift: "Shift",
});

export const formatDictationBindingLabel = (
  binding: DictationBinding,
  options: { compact?: boolean; isMac: boolean },
): string => {
  if (binding.type === "darwin-fn") {
    const separator = options.compact ? "+" : " + ";
    const labels = modifierLabels(options.isMac);
    const parts = ["Fn", ...(binding.modifiers ?? []).map((m) => labels[m])];
    if (binding.key) {
      parts.push(binding.key === "Backquote" ? "`" : binding.key);
    }
    return parts.join(separator);
  }
  if (binding.type === "chord") {
    const labels = modifierLabels(options.isMac);
    const parts = binding.fn ? ["Fn"] : [];
    if (binding.modifierKey && options.isMac) {
      parts.push(physicalModifierLabel(binding.modifierKey));
    } else {
      parts.push(...binding.modifiers.map((modifier) => labels[modifier]));
    }
    if (binding.mouseButton) {
      parts.push(formatMouseLabel(binding.mouseButton));
    } else if (binding.key) {
      parts.push(binding.key === "Backquote" ? "`" : binding.key);
    }
    if (parts.length === 0) return "Unassigned";
    return parts.join(options.compact ? "+" : " + ");
  }
  const _exhaustive: never = binding;
  return _exhaustive;
};

export const getDictationShortcutHint = (
  binding: DictationBinding,
  platform: string,
): string =>
  `Hold ${formatDictationBindingLabel(binding, {
    compact: true,
    isMac: platform === "darwin",
  })}`;

export const getDictationShortcutSnapshot = (
  binding: DictationBinding,
  platform: string,
): DictationShortcutSnapshot => {
  const normalized = normalizeDictationBinding(binding, platform);
  return {
    binding: normalized,
    hint: getDictationShortcutHint(normalized, platform),
    label: formatDictationBindingLabel(normalized, {
      isMac: platform === "darwin",
    }),
  };
};

export const bindingRequiresShift = (binding: DictationBinding): boolean =>
  binding.type === "chord" && binding.modifiers.includes("shift");

export const isStandaloneModifierBinding = (
  binding: DictationBinding | null,
): boolean =>
  binding?.type === "chord" &&
  binding.modifiers.length === 1 &&
  !binding.key &&
  binding.mouseButton === undefined &&
  !binding.fn;

export const usesDarwinFnBinding = (binding: DictationBinding): boolean =>
  binding.type === "darwin-fn" && !binding.key && !binding.modifiers?.length;

export const isFnShiftBinding = (
  binding: DictationBinding | null | undefined,
): boolean =>
  binding?.type === "darwin-fn" &&
  !binding.key &&
  binding.modifiers?.length === 1 &&
  binding.modifiers[0] === "shift";

export const validateCapturedBinding = (
  binding: DictationBinding | null,
  platform: string,
): string | null => {
  if (!binding) {
    return "No shortcut detected. Hold a key combination, then release.";
  }
  if (binding.type === "darwin-fn") {
    const modifiers = binding.modifiers ?? [];
    // Bare Fn and Fn plus a key are both captured by the native listener.
    if (modifiers.length === 0) return null;
    // Only Shift is meaningful alongside Fn: it is read during the Fn hold
    // rather than registered as its own shortcut.
    if (binding.key) {
      return "Fn plus a modifier can't also take another key. Try Fn + Shift, or Fn and a key.";
    }
    if (modifiers.length > 1 || modifiers[0] !== "shift") {
      return "Only Shift can be held with Fn. Try Fn + Shift, or Fn and a key.";
    }
    return null;
  }
  if (binding.mouseButton !== undefined) {
    return mouseButtonCaptureError(binding.mouseButton);
  }
  // macOS marks arrows and F-keys as function keys whether or not Fn is held,
  // so an Fn + F-key chord would also fire on the bare key.
  if (binding.fn && binding.key && /^F([1-9]|1[0-2])$/.test(binding.key)) {
    return "Fn cannot be combined with a function key. Try a letter or number, such as Fn + Z.";
  }
  // Fn is a modifier for this purpose, so Fn + Z needs nothing further.
  const modifierCount = binding.modifiers.length + (binding.fn ? 1 : 0);
  if (modifierCount === 0) {
    return "Add at least one modifier (Ctrl, Option/Alt, Cmd/Win, or Shift).";
  }
  if (
    modifierCount === 1 &&
    !binding.key &&
    binding.mouseButton === undefined
  ) {
    const modifier = binding.modifiers[0];
    if (platform === "darwin" && !binding.modifierKey) {
      return "A single modifier can't be the shortcut here. Try a combination like Ctrl + Shift.";
    }
    if (!isStandaloneModifierAllowed(modifier, platform)) {
      return standaloneModifierError(modifier, platform);
    }
  }
  return null;
};

export const bindingFromModifiersAndKey = (
  modifiers: ModifierId[],
  key?: string,
  mouseButton?: number,
  fn?: boolean,
  modifierKey?: ModifierKeyId,
): DictationBinding | null => {
  const sorted = sortModifiers(modifiers);
  const normalizedKey = normalizeKeyToken(key);
  if (
    fn &&
    sorted.length === 0 &&
    !normalizedKey &&
    typeof mouseButton !== "number"
  ) {
    return { type: "darwin-fn" };
  }
  const chord: Extract<DictationBinding, { type: "chord" }> = {
    modifiers: sorted,
    type: "chord",
  };
  if (fn) chord.fn = true;
  if (typeof mouseButton === "number") chord.mouseButton = mouseButton as 4 | 5;
  else if (normalizedKey) chord.key = normalizedKey;
  else if (
    modifierKey &&
    sorted.length === 1 &&
    sorted[0] === modifierForPhysicalKey(modifierKey)
  ) {
    chord.modifierKey = modifierKey;
  }
  if (
    chord.modifiers.length === 0 &&
    !chord.fn &&
    !chord.key &&
    !chord.modifierKey &&
    chord.mouseButton === undefined
  ) {
    return null;
  }
  return chord;
};

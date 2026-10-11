import { formatMouseLabel } from "./hotkey-mouse";
import {
  bindingRequiresShift,
  chordRecordFallsBackToDefault,
  dictationBindingsEqual,
  formatDictationBindingLabel,
  isFnShiftBinding,
  isStandaloneModifierBinding,
  nullableBindingsEqual,
  normalizeDictationBinding,
  type DictationBinding,
} from "./dictation-binding";
import { shortcutAlreadyInUse } from "./shortcut-conflict";
import {
  isStandaloneModifierAllowed,
  standaloneModifierError,
} from "./standalone-modifier-policy";

export type ActionPresetId =
  | "alt-meta"
  | "ctrl-alt"
  | "ctrl-meta-shift"
  | "meta-z"
  | "mouse4"
  | "mouse5";

export interface ActionPresetOption {
  binding: DictationBinding;
  id: ActionPresetId;
  label: string;
}

const MAC_ONLY = ["darwin"] as const;
const WINDOWS_ONLY = ["win32"] as const;

const PRESET_DEFS: readonly {
  binding: DictationBinding;
  id: ActionPresetId;
  label: string;
  platforms: readonly string[];
}[] = [
  {
    binding: { modifiers: ["alt", "meta"], type: "chord" },
    id: "alt-meta",
    label: "Option + Cmd",
    platforms: MAC_ONLY,
  },
  {
    binding: { modifiers: ["alt", "meta"], type: "chord" },
    id: "alt-meta",
    label: "Alt + Win",
    platforms: WINDOWS_ONLY,
  },
  {
    binding: { key: "Z", modifiers: ["meta"], type: "chord" },
    id: "meta-z",
    label: "Win + Z",
    platforms: WINDOWS_ONLY,
  },
  {
    binding: { modifiers: ["ctrl", "meta", "shift"], type: "chord" },
    id: "ctrl-meta-shift",
    label: "Ctrl + Win + Shift",
    platforms: WINDOWS_ONLY,
  },
  {
    binding: { modifiers: ["ctrl", "alt"], type: "chord" },
    id: "ctrl-alt",
    label: "Ctrl + Option",
    platforms: MAC_ONLY,
  },
  {
    binding: { modifiers: [], mouseButton: 4, type: "chord" },
    id: "mouse4",
    label: formatMouseLabel(4),
    platforms: [...MAC_ONLY, ...WINDOWS_ONLY],
  },
  {
    binding: { modifiers: [], mouseButton: 5, type: "chord" },
    id: "mouse5",
    label: formatMouseLabel(5),
    platforms: [...MAC_ONLY, ...WINDOWS_ONLY],
  },
];

export const defaultActionBinding = (
  platform: string,
): DictationBinding | null => {
  if (platform === "win32")
    return { modifiers: ["alt", "meta"], type: "chord" };
  if (platform === "darwin") return { modifiers: ["shift"], type: "darwin-fn" };
  return null;
};

export const actionBindingsEqual = (
  left: DictationBinding | null,
  right: DictationBinding | null,
): boolean => nullableBindingsEqual(left, right);

export const validateActionCapture = (
  binding: DictationBinding,
  platform: string,
): string | null => {
  if (binding.type === "chord" && isStandaloneModifierBinding(binding)) {
    const modifier = binding.modifiers[0];
    if (platform === "darwin" && binding.modifierKey) {
      return "A standalone modifier can only be used for the push to talk shortcut.";
    }
    if (isStandaloneModifierAllowed(modifier, platform)) {
      return null;
    }
    return standaloneModifierError(modifier, platform);
  }
  if (binding.type === "darwin-fn" && !isFnShiftBinding(binding)) {
    return "Fn can only start action mode as Fn + Shift.";
  }
  return null;
};

/**
 * Fn + Shift is the only Fn shortcut action mode can take: one native listener
 * watches Fn and it drives the dictation hold. Any other Fn binding could
 * never fire, so it is stored as unassigned rather than as a dead shortcut.
 */
const normalizeFnActionBinding = (
  record: Record<string, unknown>,
): DictationBinding | null => {
  // Exactly Shift: Fn + Shift + anything else would quietly lose the extra
  // modifier, since only Shift is read during the Fn hold.
  const onlyShift =
    Array.isArray(record.modifiers) &&
    record.modifiers.length === 1 &&
    record.modifiers[0] === "shift";
  return onlyShift ? { modifiers: ["shift"], type: "darwin-fn" } : null;
};

export const normalizeActionBinding = (
  value: unknown,
  platform: string,
): DictationBinding | null => {
  if (value === undefined) return defaultActionBinding(platform);
  if (value == null) return null;
  if (
    typeof value === "object" &&
    (value as { type?: string }).type === "unassigned"
  ) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (platform === "darwin" && record.type === "darwin-fn") {
    return normalizeFnActionBinding(record);
  }
  if (record.type === "chord" && record.modifierKey !== undefined) return null;
  if (chordRecordFallsBackToDefault(record, platform)) return null;
  const normalized = normalizeDictationBinding(value, platform);
  if (
    isStandaloneModifierBinding(normalized) &&
    normalized.type === "chord" &&
    !isStandaloneModifierAllowed(normalized.modifiers[0], platform)
  ) {
    return null;
  }
  return normalized;
};

/**
 * Whether action mode runs as Shift observed during the dictation hold rather
 * than as its own registered shortcut. Only Fn + Shift over a bare-Fn
 * dictation shortcut works that way.
 */
export const actionRunsAsShiftOverlay = (
  action: DictationBinding | null,
  dictation: DictationBinding,
): boolean =>
  isFnShiftBinding(action) && dictation.type === "darwin-fn" && !dictation.key;

export const resolvePersistedActionBinding = (
  stored: unknown,
  dictation: DictationBinding | null | undefined,
  platform: string,
): DictationBinding | null => {
  const action = normalizeActionBinding(stored, platform);
  if (shortcutAlreadyInUse(action, dictation)) return null;
  return action;
};

/**
 * Carries the old "also use Shift" preference into a real action binding.
 * Fn + Shift only fires over bare-Fn dictation. A chord dictation shortcut
 * becomes that chord plus Shift, which is what the overlay used to do.
 */
export const resolveOverlayPreferenceAction = (
  stored: unknown,
  dictation: DictationBinding,
  usedOverlay: boolean,
  platform: string,
): DictationBinding | null => {
  const existing =
    stored === undefined ? null : normalizeActionBinding(stored, platform);
  const unusedFnShift =
    isFnShiftBinding(existing) &&
    !actionRunsAsShiftOverlay(existing, dictation);
  if (existing && !unusedFnShift) return existing;
  if (!usedOverlay) return null;
  const fnShift: DictationBinding = { modifiers: ["shift"], type: "darwin-fn" };
  if (actionRunsAsShiftOverlay(fnShift, dictation)) return fnShift;
  if (dictation.type === "chord" && !bindingRequiresShift(dictation)) {
    return normalizeActionBinding(
      { ...dictation, modifiers: [...dictation.modifiers, "shift"] },
      platform,
    );
  }
  return null;
};

export const getActionPresetOptions = (
  platform: string,
): ActionPresetOption[] =>
  PRESET_DEFS.filter((definition) =>
    definition.platforms.includes(platform),
  ).map(({ binding, id, label }) => ({ binding, id, label }));

export const findMatchingActionPresetId = (
  binding: DictationBinding | null,
  platform: string,
): ActionPresetId | null => {
  if (!binding) return null;
  const normalized = normalizeDictationBinding(binding, platform);
  for (const definition of PRESET_DEFS) {
    if (
      definition.platforms.includes(platform) &&
      dictationBindingsEqual(definition.binding, normalized)
    ) {
      return definition.id;
    }
  }
  return null;
};

export const formatActionBindingLabel = (
  binding: DictationBinding | null,
  options: { isMac: boolean },
): string => {
  if (!binding) return "Unassigned";
  return formatDictationBindingLabel(binding, options);
};

export type ModifierId = "alt" | "ctrl" | "meta" | "shift";
export type ModifierKeyId =
  | "alt-left"
  | "alt-right"
  | "ctrl-left"
  | "ctrl-right"
  | "meta-left"
  | "meta-right"
  | "shift-left"
  | "shift-right";

const ALL_MODIFIERS: readonly ModifierId[] = ["ctrl", "alt", "shift", "meta"];

const MODIFIER_BY_KEY: Record<ModifierKeyId, ModifierId> = {
  "alt-left": "alt",
  "alt-right": "alt",
  "ctrl-left": "ctrl",
  "ctrl-right": "ctrl",
  "meta-left": "meta",
  "meta-right": "meta",
  "shift-left": "shift",
  "shift-right": "shift",
};

const MAC_VK_BY_MODIFIER_KEY: Record<ModifierKeyId, number> = {
  "alt-left": 58,
  "alt-right": 61,
  "ctrl-left": 59,
  "ctrl-right": 62,
  "meta-left": 55,
  "meta-right": 54,
  "shift-left": 56,
  "shift-right": 60,
};

const MODIFIER_KEY_LABELS: Record<ModifierKeyId, string> = {
  "alt-left": "Option",
  "alt-right": "Right Option",
  "ctrl-left": "Control",
  "ctrl-right": "Right Control",
  "meta-left": "Command",
  "meta-right": "Right Command",
  "shift-left": "Shift",
  "shift-right": "Right Shift",
};

export const isModifierId = (value: unknown): value is ModifierId =>
  value === "alt" || value === "ctrl" || value === "meta" || value === "shift";

export const isModifierKeyId = (value: unknown): value is ModifierKeyId =>
  typeof value === "string" && value in MODIFIER_BY_KEY;

export const sortModifiers = (modifiers: ModifierId[]): ModifierId[] =>
  ALL_MODIFIERS.filter((modifier) => modifiers.includes(modifier));

export const modifierForPhysicalKey = (
  modifierKey: ModifierKeyId,
): ModifierId => MODIFIER_BY_KEY[modifierKey];

export const macVirtualKeyForModifier = (modifierKey: ModifierKeyId): number =>
  MAC_VK_BY_MODIFIER_KEY[modifierKey];

export const physicalModifierLabel = (modifierKey: ModifierKeyId): string =>
  MODIFIER_KEY_LABELS[modifierKey];

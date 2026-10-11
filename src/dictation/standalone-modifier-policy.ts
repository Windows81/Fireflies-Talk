import type { ModifierId } from "./shortcut-modifiers";

const ALLOWED_NON_MAC_MODIFIERS = new Set<ModifierId>(["alt", "shift"]);

const MODIFIER_LABELS: Record<ModifierId, { mac: string; windows: string }> = {
  alt: { mac: "Option", windows: "Alt" },
  ctrl: { mac: "Control", windows: "Ctrl" },
  meta: { mac: "Command", windows: "The Windows key" },
  shift: { mac: "Shift", windows: "Shift" },
};

const EXAMPLES: Record<ModifierId, { mac: string; windows: string }> = {
  alt: { mac: "Option + Cmd", windows: "Ctrl + Win" },
  ctrl: { mac: "Ctrl + Cmd", windows: "Ctrl + Win" },
  meta: { mac: "Ctrl + Cmd", windows: "Ctrl + Win" },
  shift: { mac: "Ctrl + Shift", windows: "Ctrl + Shift" },
};

export const isStandaloneModifierAllowed = (
  modifier: ModifierId,
  platform: string,
): boolean => platform === "darwin" || ALLOWED_NON_MAC_MODIFIERS.has(modifier);

export const standaloneModifierError = (
  modifier: ModifierId,
  platform: string,
): string => {
  const labels = MODIFIER_LABELS[modifier];
  const example = EXAMPLES[modifier];
  const label = platform === "darwin" ? labels.mac : labels.windows;
  const combination = platform === "darwin" ? example.mac : example.windows;
  return `${label} on its own can't be the shortcut. Add another key, like ${combination}.`;
};

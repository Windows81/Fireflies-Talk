import type { DictationBinding, ModifierId } from "./dictation-binding";
import { formatMouseLabel } from "./hotkey-mouse";
import { modifierForPhysicalKey } from "./shortcut-modifiers";

export interface ShortcutKeycap {
  glyph?: string;
  icon?: "command" | "windows";
  label: string;
  side?: "right";
}

const modifierLabels: Record<
  ModifierId,
  Pick<ShortcutKeycap, "glyph" | "icon" | "label">
> = {
  alt: { glyph: "⌥", label: "Opt" },
  ctrl: { glyph: "⌃", label: "Ctrl" },
  meta: { icon: "command", label: "Cmd" },
  shift: { glyph: "⇧", label: "Shift" },
};

const windowsModifierLabels: Record<
  ModifierId,
  Pick<ShortcutKeycap, "icon" | "label">
> = {
  alt: { label: "Alt" },
  ctrl: { label: "Ctrl" },
  meta: { icon: "windows", label: "Win" },
  shift: { label: "Shift" },
};

const keyLabel = (key: string): string => (key === "Backquote" ? "`" : key);

const modifierKeycap = (
  modifier: ModifierId,
  isMac: boolean,
): ShortcutKeycap =>
  isMac ? modifierLabels[modifier] : windowsModifierLabels[modifier];

export const getDictationBindingKeycaps = (
  binding: DictationBinding,
  options: { isMac: boolean },
): ShortcutKeycap[] => {
  const keycaps: ShortcutKeycap[] = [];
  const { isMac } = options;

  if (binding.type === "darwin-fn") {
    keycaps.push({ label: "Fn" });
    keycaps.push(
      ...(binding.modifiers ?? []).map((modifier) =>
        modifierKeycap(modifier, isMac),
      ),
    );
    if (binding.key) keycaps.push({ label: keyLabel(binding.key) });
    return keycaps;
  }

  if (binding.fn) {
    keycaps.push({ label: "Fn" });
  }
  if (binding.modifierKey && isMac) {
    const modifier = modifierForPhysicalKey(binding.modifierKey);
    keycaps.push({
      ...modifierKeycap(modifier, true),
      ...(binding.modifierKey.endsWith("-right")
        ? { side: "right" as const }
        : {}),
    });
  } else {
    keycaps.push(
      ...binding.modifiers.map((modifier) => modifierKeycap(modifier, isMac)),
    );
  }
  if (binding.mouseButton) {
    keycaps.push({ label: formatMouseLabel(binding.mouseButton) });
  } else if (binding.key) {
    keycaps.push({ label: keyLabel(binding.key) });
  }
  return keycaps;
};

import { isWindowsDesktop } from "@/utils/device";

/** Pill idle label, e.g. "Hold Fn" or "Hold Ctrl+Win". */
export function defaultDictationHint(): string {
  if (isWindowsDesktop()) {
    return "Hold Ctrl+Win";
  }
  return "Hold Fn";
}

/** Key chord from a pill hint, e.g. "Hold Fn" → "Fn". */
export function dictationHotkeyLabel(hint: string): string {
  return hint.replace(/^Hold\s+/i, "");
}

/**
 * The quick-note chord as the platform writes it. Mirrors the accelerator
 * quick-note-shortcut.ts registers ("CommandOrControl+Alt+<key>"), so the pill
 * promises the keys that actually work.
 */
export function notesShortcutLabel(key: string): string {
  const stroke = (key || "N").toUpperCase();
  return isWindowsDesktop() ? `Ctrl+Alt+${stroke}` : `\u2318\u2325${stroke}`;
}

import { getActualPlatform } from "./device";

// macOS uses Cmd (⌘) + Option (⌥), Windows/Linux use Ctrl + Alt.
const isMac = getActualPlatform() === "darwin";

/** Modifier key labels for each OS, used in keycap UI rendering. */
export const shortcutModifierKeys: string[] = isMac
  ? ["Cmd", "Option"]
  : ["Ctrl", "Alt"];

/**
 * Formats a global shortcut (Cmd/Ctrl+Alt+{key}) for display.
 * Produces "⌘⌥N" on macOS and "Ctrl+Alt+N" on Windows/Linux.
 */
export function formatGlobalShortcut(key: string): string {
  return isMac ? `⌘⌥${key}` : `Ctrl+Alt+${key}`;
}

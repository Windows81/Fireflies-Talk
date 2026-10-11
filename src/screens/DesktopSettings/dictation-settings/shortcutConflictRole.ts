import type { DictationBinding } from "electron/src/dictation/dictation-binding";
import {
  shortcutAlreadyInUse,
  type ShortcutRole,
} from "electron/src/dictation/shortcut-conflict";

export interface ShortcutConflict {
  binding: DictationBinding | null;
  message?: string;
  role: ShortcutRole;
}

export function findShortcutConflict(
  binding: DictationBinding,
  conflicts: readonly ShortcutConflict[],
): ShortcutConflict | null {
  return (
    conflicts.find((other) => shortcutAlreadyInUse(binding, other.binding)) ??
    null
  );
}

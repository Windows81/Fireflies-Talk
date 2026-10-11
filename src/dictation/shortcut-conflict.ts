import {
  dictationBindingsEqual,
  type DictationBinding,
} from "./dictation-binding";
import { polishConflictBindings } from "./polish-binding";

export type ShortcutRole = "action" | "dictation" | "handsFree" | "polish";

/**
 * Fn + Space is the same keypress whether the Fn listener owns it (push to
 * talk, polish) or a chord helper does (hands-free), so compare one shape.
 */
function asFnKeyBinding(binding: DictationBinding): DictationBinding {
  if (binding.type !== "chord" || !binding.fn || !binding.key) return binding;
  if (binding.modifiers.length > 0) return binding;
  return { key: binding.key, type: "darwin-fn" };
}

export function shortcutAlreadyInUse(
  candidate: DictationBinding | null | undefined,
  taken: DictationBinding | null | undefined,
): boolean {
  if (!candidate || !taken) return false;
  return polishConflictBindings(asFnKeyBinding(candidate)).some((left) =>
    polishConflictBindings(asFnKeyBinding(taken)).some((right) =>
      dictationBindingsEqual(left, right),
    ),
  );
}

const ROLE_USE: Record<ShortcutRole, string> = {
  action: "for commands",
  dictation: "to dictate",
  handsFree: "to dictate hands-free",
  polish: "to rewrite selected text",
};

export function shortcutTakenError(takenBy: ShortcutRole): string {
  return `That shortcut is already used ${ROLE_USE[takenBy]}.`;
}

export function formatTakenPresetLabel(
  label: string,
  takenBy: ShortcutRole,
): string {
  return `${label} · in use ${ROLE_USE[takenBy]}`;
}

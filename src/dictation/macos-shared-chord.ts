import type { DictationBinding } from "./dictation-binding";

type ChordBinding = Extract<DictationBinding, { type: "chord" }>;

/**
 * Whether the action chord presses the same key or mouse button as the
 * dictation chord (Ctrl+Option+D and Ctrl+Option+Shift+D). The native helper
 * consumes that key before any other listener can see it, so both roles must
 * be evaluated by the one helper that owns the key.
 */
export const sharesChordTarget = (
  dictation: DictationBinding,
  action: DictationBinding | null,
): action is ChordBinding => {
  if (dictation.type !== "chord" || action?.type !== "chord") return false;
  if (dictation.mouseButton !== undefined) {
    return dictation.mouseButton === action.mouseButton;
  }
  return dictation.key !== undefined && dictation.key === action.key;
};

/** `--action-mods=ctrl,alt,shift` for the helper that owns the shared key. */
export const macSharedActionArg = (action: ChordBinding): string => {
  const names = [...action.modifiers, ...(action.fn ? ["fn"] : [])];
  return `--action-mods=${names.join(",")}`;
};

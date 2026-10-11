import type { ModifierId } from "./dictation-binding";

export interface CaptureModifierFlags {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

/** Win is swallowed during recording, so Chromium may not set metaKey. */
export function modifiersFromCaptureFlags(
  flags: CaptureModifierFlags,
  captureWinHeld: boolean,
): ModifierId[] {
  const modifiers: ModifierId[] = [];
  if (flags.ctrlKey) modifiers.push("ctrl");
  if (flags.altKey) modifiers.push("alt");
  if (flags.shiftKey) modifiers.push("shift");
  if (flags.metaKey || captureWinHeld) modifiers.push("meta");
  return modifiers;
}

export function isCaptureFullyReleased(
  flags: CaptureModifierFlags,
  captureWinHeld: boolean,
  fnHeld = false,
): boolean {
  return (
    !flags.ctrlKey &&
    !flags.altKey &&
    !flags.shiftKey &&
    !flags.metaKey &&
    !captureWinHeld &&
    !fnHeld
  );
}

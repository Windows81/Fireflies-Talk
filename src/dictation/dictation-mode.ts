import type { DictationMode, DictationState } from "../types";

/** Bare hotkey = dictate. Extra Shift (when it is not part of the chord) = command. */
export function resolveDictationMode(
  shiftHeld: boolean,
  bindingRequiresShift: boolean,
  overlayEnabled = true,
  forceDictate = false,
): DictationMode {
  if (forceDictate || !overlayEnabled) return "dictate";
  return !bindingRequiresShift && shiftHeld ? "command" : "dictate";
}

/**
 * Shift often arrives a few milliseconds after the hotkey down — on Windows
 * Ctrl+Win completes first, then Shift; on macOS Globe/Fn does the same.
 * If a push-to-talk recording has already started as dictate, a later Shift
 * should still switch to command mode while the hotkey is held. Hands-free
 * (latched) sessions and the pending double-tap window stay on the mode
 * chosen at start.
 */
export function shouldUpgradeToCommandMode(params: {
  bindingRequiresShift: boolean;
  hotkeyHeld: boolean;
  latched: boolean;
  overlayEnabled?: boolean;
  recording: boolean;
  shiftDown: boolean;
}): boolean {
  return (
    (params.overlayEnabled ?? true) &&
    params.recording &&
    params.shiftDown &&
    params.hotkeyHeld &&
    !params.bindingRequiresShift &&
    !params.latched
  );
}

/** Idle is not a session, so leftover command mode must not stick for hover. */
export function nextDictationModeForState(
  state: DictationState,
  currentMode: DictationMode,
): DictationMode {
  switch (state) {
    case "idle":
      return "dictate";
    case "recording":
    case "processing":
      return currentMode;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

/** Purple ring belongs on the main capsule while a command session is active. */
export function shouldShowCommandChrome(
  mode: DictationMode,
  state: DictationState,
): boolean {
  return mode === "command" && state !== "idle";
}

/** A new session must not start until the last one has finished pasting. */
export function canBeginDictation(
  state: DictationState,
  sessionBusy = false,
): boolean {
  return state !== "processing" && !sessionBusy;
}

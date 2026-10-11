import {
  bindingFromModifiersAndKey,
  validateCapturedBinding,
  type DictationBinding,
  type ModifierKeyId,
} from "./dictation-binding";
import {
  modifiersFromCaptureFlags,
  type CaptureModifierFlags,
} from "./shortcut-capture-modifiers";

export interface CapturePeakState {
  captureWinHeld: boolean;
  /** macOS reports Fn out of band; Chromium never sets a flag for it. */
  fnHeld: boolean;
  lastFlags: CaptureModifierFlags;
  lastKey?: string;
  lastModifierKey?: ModifierKeyId;
  lastMouse?: 4 | 5;
  peak: DictationBinding | null;
  platform: string;
  rejection: string | null;
}

const emptyFlags = (): CaptureModifierFlags => ({
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
});

export const initialCapturePeakState = (
  platform: string,
): CapturePeakState => ({
  captureWinHeld: false,
  fnHeld: false,
  lastFlags: emptyFlags(),
  peak: null,
  platform,
  rejection: null,
});

function chordScore(binding: DictationBinding): number {
  if (binding.type !== "chord") return 0;
  const modifiers = binding.modifiers.length + (binding.fn ? 1 : 0);
  if (binding.mouseButton !== undefined) return 50 + modifiers;
  return modifiers + (binding.key ? 10 : 0);
}

export function strongerCaptureBinding(
  current: DictationBinding | null,
  next: DictationBinding | null,
  platform: string,
): DictationBinding | null {
  if (!next || validateCapturedBinding(next, platform)) return current;
  if (!current) return next;
  if (chordScore(next) > chordScore(current)) return next;
  return current;
}

export function commitHeldMouseBinding(
  pending: DictationBinding | null,
  peak: DictationBinding | null,
  releasedButton: 4 | 5,
  platform: string,
): DictationBinding | null {
  if (
    !pending ||
    pending.type !== "chord" ||
    pending.mouseButton !== releasedButton
  ) {
    return null;
  }

  if (peak?.type === "chord" && peak.mouseButton === releasedButton) {
    return strongerCaptureBinding(pending, peak, platform) ?? pending;
  }

  return pending;
}

function consider(state: CapturePeakState, key?: string): CapturePeakState {
  const candidate = bindingFromModifiersAndKey(
    modifiersFromCaptureFlags(state.lastFlags, state.captureWinHeld),
    key ?? state.lastKey,
    state.lastMouse,
    state.fnHeld,
    state.lastModifierKey,
  );
  if (!candidate) return state;
  const error = validateCapturedBinding(candidate, state.platform);
  if (error) {
    const isLoneModifier =
      candidate.type === "chord" &&
      candidate.modifiers.length === 1 &&
      !candidate.key &&
      candidate.mouseButton === undefined &&
      !candidate.fn;
    return isLoneModifier ? { ...state, rejection: error } : state;
  }
  if (!state.peak || chordScore(candidate) > chordScore(state.peak)) {
    return { ...state, peak: candidate, rejection: null };
  }
  return { ...state, rejection: null };
}

export function applyCaptureKeyDown(
  state: CapturePeakState,
  flags: CaptureModifierFlags,
  key: string | null,
  modifierKey?: ModifierKeyId,
): CapturePeakState {
  return consider(
    {
      ...state,
      lastFlags: flags,
      lastKey: key ?? state.lastKey,
      lastModifierKey: modifierKey ?? state.lastModifierKey,
    },
    key ?? undefined,
  );
}

export function applyCaptureWin(
  state: CapturePeakState,
  down: boolean,
): CapturePeakState {
  return consider(
    {
      ...state,
      captureWinHeld: down,
      lastFlags: { ...state.lastFlags, metaKey: down },
    },
    state.lastKey,
  );
}

/**
 * Releasing a plain key clears it, so tapping Fn afterwards cannot combine
 * with a key that is no longer held into a chord nobody pressed.
 */
export function applyCaptureKeyUp(
  state: CapturePeakState,
  flags: CaptureModifierFlags,
  key: string | null,
): CapturePeakState {
  const released = key !== null && key === state.lastKey;
  const next: CapturePeakState = {
    ...state,
    lastFlags: flags,
    ...(released ? { lastKey: undefined } : {}),
  };
  return consider(next, next.lastKey);
}

export function applyCaptureFn(
  state: CapturePeakState,
  down: boolean,
): CapturePeakState {
  return consider({ ...state, fnHeld: down }, state.lastKey);
}

export function applyCaptureMouse(
  state: CapturePeakState,
  flags: CaptureModifierFlags,
  button: 4 | 5,
  down: boolean,
): CapturePeakState {
  return consider(
    {
      ...state,
      lastFlags: flags,
      lastMouse: down ? button : state.lastMouse,
    },
    state.lastKey,
  );
}

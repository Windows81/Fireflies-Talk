import {
  validateCapturedBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";
import { isCaptureFullyReleased } from "electron/src/dictation/shortcut-capture-modifiers";
import type { CapturePeakState } from "electron/src/dictation/shortcut-capture-peak";

export const dictationShortcutHint = (isMac: boolean): string =>
  isMac
    ? "A modifier key, a combination like Ctrl + Cmd, or a side mouse button."
    : "Shift, Alt, a combination like Ctrl + Win, or a side mouse button.";

export type CaptureResult = {
  binding?: DictationBinding;
  error?: string;
};

export const finishCapturePeak = (
  capture: CapturePeakState,
  platform: string,
  finish: (result: CaptureResult) => void,
): void => {
  const isReleased = isCaptureFullyReleased(
    capture.lastFlags,
    capture.captureWinHeld,
    capture.fnHeld,
  );
  if (!isReleased) return;
  if (!capture.peak) {
    if (capture.rejection) finish({ error: capture.rejection });
    return;
  }
  const error = validateCapturedBinding(capture.peak, platform);
  if (error) {
    finish({ error });
    return;
  }
  finish({ binding: capture.peak });
};

import { isWindowsDesktop } from "@/utils/device";
import { formatDictationServiceError } from "./dictationErrorMessage";

export {
  DICTATION_CANCELLED_MESSAGE,
  formatDictationServiceError,
  isAbortError,
  isDictationCancelledError,
  remapTimedOutAbortError,
} from "./dictationErrorMessage";

export function micPermissionDeniedMessage(): string {
  if (isWindowsDesktop()) {
    return "Microphone access denied — enable it in Settings → Privacy & security → Microphone, then try again.";
  }
  return "Microphone access denied — grant permission in System Settings and try again.";
}

/** Plain status the person should read; device names stay out of the console. */
export function notifyDictationNotice(text: string): void {
  void window.electron?.notification.show(
    "Dictation",
    text,
    undefined,
    undefined,
    {
      timeout: 4000,
      showProgress: false,
      showCloseAlways: true,
    },
  );
}

export function notifyDictationError(body: string): void {
  const trimmed = body.trim();
  const text =
    trimmed && trimmed !== "[object Object]"
      ? trimmed
      : "Couldn't transcribe that. Try again.";
  console.error("[useDictation]", body);
  notifyDictationNotice(text);
}

export function notifyCommandAction(text: string): void {
  window.electron?.notification.show(
    "Action Mode",
    text,
    undefined,
    undefined,
    {
      timeout: 5000,
      showProgress: false,
      showCloseAlways: true,
    },
  );
}

export function notifyDictationStartError(error: unknown): void {
  const domError = error as DOMException;
  if (domError.name === "NotAllowedError") {
    notifyDictationError(micPermissionDeniedMessage());
    return;
  }
  if (domError.name === "NotFoundError") {
    notifyDictationError("No microphone found.");
    return;
  }
  if (domError.name === "NotReadableError") {
    notifyDictationError("Microphone is in use by another app.");
    return;
  }
  notifyDictationError(
    `Failed to start recording: ${formatDictationServiceError(error)}`,
  );
}

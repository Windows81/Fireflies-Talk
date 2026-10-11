/**
 * The dictation onboarding demos dictate into their own mock fields. Pasting
 * would blur Fireflies and drop the text into whichever app the user was in
 * before, so the paste is suppressed while a demo is mounted and the text is
 * handed straight to the demo instead.
 *
 * Delivery is a direct callback. History is written separately and is not
 * how the demo field gets its text. Duplicate deliveries for the same paste
 * epoch are dropped and return false; other deliveries return true, and epoch
 * 0 is never deduplicated.
 */
type DictationTextListener = (text: string) => void;

let capturingInApp = false;
let recordingStartedInApp = false;
let listener: DictationTextListener | null = null;
let lastDeliveredEpoch = 0;

export function setDictationInAppCapture(active: boolean): void {
  capturingInApp = active;
  if (!active) listener = null;
}

/**
 * Changes whether new recordings are claimed in-app without dropping the
 * registered field, so a recording that already started here still lands here.
 */
export function setDictationInAppOwnership(active: boolean): void {
  capturingInApp = active;
}

/**
 * Fixes who owns the recording that is about to start. Ownership cannot be
 * read when the text is finally ready: a dictation begun in another app can
 * still be transcribing when a demo mounts, and that text belongs in the app
 * the user was typing in, not in the demo.
 */
export function claimDictationRecording(): void {
  recordingStartedInApp = capturingInApp;
}

export function isDictationRecordingInApp(): boolean {
  return recordingStartedInApp;
}

/**
 * Whether a demo is listening right now. The destination for work that has no
 * recording of its own — polishing a selection — since there was no start for
 * ownership to be claimed at.
 */
export function isDictationInAppCapture(): boolean {
  return capturingInApp;
}

/**
 * Registers the field that should receive dictated text. Steps that suppress
 * the paste without listening (the shortcut test) simply discard it.
 */
export function onDictationInAppText(
  callback: DictationTextListener,
): () => void {
  listener = callback;
  return () => {
    if (listener === callback) listener = null;
  };
}

export function deliverDictationInApp(text: string, pasteEpoch = 0): boolean {
  if (pasteEpoch >= 1 && pasteEpoch === lastDeliveredEpoch) return false;
  if (pasteEpoch >= 1) lastDeliveredEpoch = pasteEpoch;
  listener?.(text);
  return true;
}

/** Cancels only a recording that started in the demo. Leaves overlay ownership. */
export function cancelDemoRecording(cancelInAppRecording: () => void): void {
  if (!isDictationRecordingInApp()) return;
  recordingStartedInApp = false;
  cancelInAppRecording();
}

/** Drops overlay ownership. Cancels only a recording that started in the demo. */
export function releaseOnboardingCapture(
  cancelInAppRecording: () => void,
): void {
  setDictationInAppCapture(false);
  cancelDemoRecording(cancelInAppRecording);
}

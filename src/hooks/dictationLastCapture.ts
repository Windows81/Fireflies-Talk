import { create } from "zustand";
import type { DictationMicrophoneCapture } from "./dictationMicrophone";

export interface DictationLastCapture {
  /** Id of the mic that was asked for; empty for the system default. */
  requestedDeviceId: string;
  /** Name of the mic that really opened. */
  activeLabel: string;
  usingFallback: boolean;
}

interface DictationLastCaptureStore {
  lastCapture: DictationLastCapture | null;
  record: (capture: DictationMicrophoneCapture) => void;
}

/**
 * What the most recent microphone open really did, for screens that must not
 * claim the saved mic is in use when capture had to fall back. In memory only:
 * a relaunch starts with no claim at all.
 */
export const useDictationLastCapture = create<DictationLastCaptureStore>(
  (set) => ({
    lastCapture: null,
    record: (capture) =>
      set({
        lastCapture: {
          requestedDeviceId: capture.requested?.deviceId ?? "",
          activeLabel: capture.active.label,
          usingFallback: capture.usingFallback,
        },
      }),
  }),
);

export const recordDictationCapture = (
  capture: DictationMicrophoneCapture,
): void => useDictationLastCapture.getState().record(capture);

/**
 * True when the last open asked for the mic saved now and had to use another
 * one — the person's choice is still on file but is not what Talk heard.
 */
export const lastCaptureFellBackFrom = (
  lastCapture: DictationLastCapture | null,
  savedDeviceId: string,
): lastCapture is DictationLastCapture =>
  lastCapture !== null &&
  lastCapture.usingFallback &&
  Boolean(savedDeviceId) &&
  lastCapture.requestedDeviceId === savedDeviceId;

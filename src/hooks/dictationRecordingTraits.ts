import type { DictationStopSource } from "electron/src/types";
import type { DictationTranscriptionProvider } from "@/features/settings/dictationTranscriptionProvider";

export type DictationMicKind = "builtIn" | "bluetooth" | "other";

/** What the recording behind a dictation was like, for the pasted event. */
export type DictationRecordingTraits = {
  handsFree: boolean;
  /** How the recording ended: the hotkey, the pill's button, or the app itself (time limit, lost mic). */
  trigger: DictationStopSource;
  micKind: DictationMicKind;
  /** Settings as the recording started, which is when the session read them. */
  transcriptionProvider: DictationTranscriptionProvider;
  languageHintsCount: number;
};

/**
 * Chromium names macOS inputs with their transport, e.g. "MacBook Pro
 * Microphone (Built-in)" or "AirPods Pro (Bluetooth)"; Windows Bluetooth
 * headsets show up as "Hands-Free". Anything else is reported as other.
 */
export function classifyMicrophone(trackLabel: string): DictationMicKind {
  const label = trackLabel.toLowerCase();
  if (/bluetooth|airpods|hands-free/.test(label)) return "bluetooth";
  if (/built-in|internal/.test(label)) return "builtIn";
  return "other";
}

/** Collects one recording's traits as the runtime moves through it. */
export function createRecordingTraits(settings: {
  getTranscriptionProvider: () => DictationTranscriptionProvider;
  getLanguageHintsCount: () => number;
}) {
  const fresh = (): DictationRecordingTraits => ({
    handsFree: false,
    trigger: "hotkey",
    micKind: "other",
    transcriptionProvider: settings.getTranscriptionProvider(),
    languageHintsCount: settings.getLanguageHintsCount(),
  });
  let traits = fresh();

  return {
    current: () => traits,
    beginCapture: () => {
      traits = fresh();
    },
    micOpened: (trackLabel: string) => {
      traits.micKind = classifyMicrophone(trackLabel);
    },
    revealed: (handsFree: boolean) => {
      traits.handsFree = handsFree;
    },
    latched: () => {
      traits.handsFree = true;
    },
    stopped: (source: DictationStopSource | undefined) => {
      traits.trigger = source ?? "hotkey";
    },
  };
}

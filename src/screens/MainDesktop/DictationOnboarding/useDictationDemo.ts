import { useLocalSettings } from "@/features/settings";
import {
  cancelDemoRecording,
  onDictationInAppText,
} from "@/hooks/dictationInAppCapture";
import { getActualPlatform } from "@/utils/device";
import type { DictationMode } from "electron/src/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { onboardingShortcutLabel } from "./shortcutCopy";

/**
 * Whether the last attempt produced anything. "empty" covers silence, a failed
 * transcription and an abandoned recording alike — from the demo's point of
 * view they are the same thing: nothing to show.
 */
export type DemoResult = "waiting" | "text" | "empty";

/**
 * A transcription that neither arrives nor fails would leave the demo waiting
 * for good, so an attempt is abandoned once this much time has passed since
 * the recording stopped. Well clear of a normal transcription, because
 * expiring aborts the work rather than merely giving up on displaying it.
 */
const RESULT_TIMEOUT_MS = 30_000;

export interface DictationDemoEvents {
  /** Recording began — the hotkey went down, or a double tap latched it. */
  onStart?: (handsFree: boolean) => void;
  /** A double tap latched the recording into hands-free. */
  onLatched?: () => void;
  /** Recording finished and is being transcribed. */
  onStop?: () => void;
  /** Recording was abandoned instead of finalized. */
  onCancel?: () => void;
}

export interface DictationDemo {
  shortcutLabel: string;
  /** The hotkey is physically down right now, whatever the recording is doing. */
  held: boolean;
  recording: boolean;
  dictatedText: string;
  /** Distinguishes "still transcribing" from "came back with nothing". */
  result: DemoResult;
  /** How long the last recording ran, for the closing speed comparison. */
  spokenMs: number;
  setDictatedText: (text: string) => void;
  /** Call when the demo starts listening, clearing any earlier attempt. */
  armCapture: () => void;
}

/**
 * Shared plumbing for the onboarding demos that dictate into their own mock
 * field: the hotkey label, whether a recording is live, and the transcribed
 * text. The overlay suppresses OS paste; this hook only receives the text.
 */
export function useDictationDemo(events: DictationDemoEvents): DictationDemo {
  const { dictationShortcut } = useLocalSettings();
  const platform = getActualPlatform();
  const shortcutLabel = onboardingShortcutLabel(dictationShortcut, platform);
  const [held, setHeld] = useState(false);
  const [recording, setRecording] = useState(false);
  const [dictatedText, setDictatedText] = useState("");
  const [result, setResult] = useState<DemoResult>("waiting");
  const [spokenMs, setSpokenMs] = useState(0);
  const startedAtRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const clearResultTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  useEffect(() => {
    const stopListening = onDictationInAppText((text) => {
      clearResultTimeout();
      setDictatedText(text);
      setResult(text.trim() ? "text" : "empty");
    });
    return () => {
      stopListening();
      cancelDemoRecording(() => window.electron?.dictation?.requestCancel?.());
    };
  }, [clearResultTimeout]);

  useEffect(() => {
    const dict = window.electron?.dictation;
    const start = (_mode: DictationMode, handsFree: boolean) => {
      setRecording(true);
      // Hold or hands-free, the key-down to key-up span is the time spent
      // speaking, which is what the words-per-minute figure divides by.
      if (startedAtRef.current === 0) startedAtRef.current = Date.now();
      eventsRef.current.onStart?.(handsFree);
    };
    const finish = (notify?: () => void) => {
      setRecording(false);
      if (startedAtRef.current > 0) {
        setSpokenMs(Date.now() - startedAtRef.current);
        startedAtRef.current = 0;
      }
      notify?.();
    };
    const unsubs = [
      dict?.onHotkeyHeld?.(setHeld),
      dict?.onCapture?.(() => start("dictate", false)),
      dict?.onStart?.(start),
      dict?.onLatched?.(() => eventsRef.current.onLatched?.()),
      dict?.onStop?.(() =>
        finish(() => {
          timeoutRef.current = setTimeout(() => {
            // Processing that is still running would ignore the next hotkey
            // press, so the retry has to cancel it rather than race it.
            cancelDemoRecording(() =>
              window.electron?.dictation?.requestCancel?.(),
            );
            setResult("empty");
          }, RESULT_TIMEOUT_MS);
          eventsRef.current.onStop?.();
        }),
      ),
      dict?.onCancel?.(() =>
        finish(() => {
          setResult("empty");
          eventsRef.current.onCancel?.();
        }),
      ),
    ];
    return () => {
      unsubs.forEach((unsub) => unsub?.());
      clearResultTimeout();
    };
  }, [clearResultTimeout]);

  // Called once a demo is already recording, so it must leave the recording's
  // start time alone — finish() is what clears it, after the span is measured.
  const armCapture = useCallback(() => {
    clearResultTimeout();
    setDictatedText("");
    setResult("waiting");
    setSpokenMs(0);
  }, [clearResultTimeout]);

  return {
    shortcutLabel,
    held,
    recording,
    dictatedText,
    result,
    spokenMs,
    setDictatedText,
    armCapture,
  };
}

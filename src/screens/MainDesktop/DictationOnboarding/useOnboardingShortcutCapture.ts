import { toast } from "@/components/Toast";
import { normalizeActionBinding } from "electron/src/dictation/action-binding";
import {
  HANDS_FREE_SHARED_KEY_ERROR,
  handsFreeBindingFromCapture,
  handsFreeFnTaken,
  handsFreeSharesKey,
  validateHandsFreeCapture,
} from "electron/src/dictation/hands-free-binding";
import {
  isFnShiftBinding,
  type DictationBinding,
} from "electron/src/dictation/dictation-binding";
import {
  normalizePolishBinding,
  polishSharesKey,
  SHARES_POLISH_KEY_ERROR,
} from "electron/src/dictation/polish-binding";
import { reservedShortcutError } from "electron/src/dictation/reserved-shortcuts";
import {
  shortcutAlreadyInUse,
  shortcutTakenError,
} from "electron/src/dictation/shortcut-conflict";
import { captureDictationShortcut } from "@/screens/DesktopSettings/dictation-settings/captureDictationShortcut";
import {
  releaseShortcutRecording,
  tryAcquireShortcutRecording,
} from "@/screens/DesktopSettings/dictation-settings/shortcutRecordingLock";
import { useCallback, useEffect, useRef, useState } from "react";

export type OnboardingShortcutCaptureTarget = "dictation" | "handsFree";

interface UseOnboardingShortcutCaptureOptions {
  actionModeAvailable: boolean;
  actionShortcut: unknown;
  draft: DictationBinding;
  handsFreeDraft: DictationBinding | null;
  onDictationCaptured: (binding: DictationBinding) => void;
  onHandsFreeCaptured: (binding: DictationBinding) => void;
  onHandsFreeConflict: () => void;
  platform: string;
  polishShortcut: unknown;
}

const CAPTURE_FAILED = "Couldn't capture that shortcut.";

export function useOnboardingShortcutCapture({
  actionModeAvailable,
  actionShortcut,
  draft,
  handsFreeDraft,
  onDictationCaptured,
  onHandsFreeCaptured,
  onHandsFreeConflict,
  platform,
  polishShortcut,
}: UseOnboardingShortcutCaptureOptions) {
  const [capturing, setCapturing] =
    useState<OnboardingShortcutCaptureTarget | null>(null);
  const [progress, setProgress] = useState<DictationBinding | null>(null);
  const recorderId = useRef(Symbol("onboarding-shortcut-recorder"));
  const abortRef = useRef<AbortController | null>(null);

  const handleRecord = useCallback(
    async (target: OnboardingShortcutCaptureTarget) => {
      if (!tryAcquireShortcutRecording(recorderId.current)) return;
      const abort = new AbortController();
      abortRef.current = abort;
      setCapturing(target);
      setProgress(null);
      window.electron?.dictation?.pauseHotkey?.();
      try {
        const result = await captureDictationShortcut({
          allowBareFn: true,
          onProgress: setProgress,
          signal: abort.signal,
        });
        if (result.error === "Cancelled.") return;
        if (result.error || !result.binding) {
          toast({ type: "error", message: result.error ?? CAPTURE_FAILED });
          return;
        }
        const binding =
          target === "handsFree"
            ? handsFreeBindingFromCapture(result.binding)
            : result.binding;
        const reserved = reservedShortcutError(binding, platform);
        if (reserved) {
          toast({ type: "error", message: reserved });
          return;
        }
        if (isFnShiftBinding(binding)) {
          toast({
            type: "error",
            message: actionModeAvailable
              ? target === "dictation"
                ? "Fn + Shift starts action mode. Pick something else to dictate with."
                : "Fn + Shift is reserved. Pick something else."
              : target === "handsFree"
                ? "That shortcut is reserved. Pick something else."
                : "Fn + Shift is reserved. Pick something else to dictate with.",
          });
          return;
        }
        const actionBinding = normalizeActionBinding(actionShortcut, platform);
        if (shortcutAlreadyInUse(binding, actionBinding)) {
          toast({
            type: "error",
            message: actionModeAvailable
              ? shortcutTakenError("action")
              : "That shortcut is reserved. Pick something else to dictate with.",
          });
          return;
        }
        const polishBinding = normalizePolishBinding(polishShortcut, platform);
        if (shortcutAlreadyInUse(binding, polishBinding)) {
          toast({ type: "error", message: shortcutTakenError("polish") });
          return;
        }
        if (polishSharesKey(polishBinding, binding)) {
          toast({ type: "error", message: SHARES_POLISH_KEY_ERROR });
          return;
        }
        if (target === "handsFree") {
          if (shortcutAlreadyInUse(binding, draft)) {
            toast({ type: "error", message: shortcutTakenError("dictation") });
            return;
          }
          const handsFreeError =
            validateHandsFreeCapture(binding, platform, draft) ??
            (handsFreeSharesKey(binding, draft, actionBinding)
              ? HANDS_FREE_SHARED_KEY_ERROR
              : null);
          if (handsFreeError) {
            toast({ type: "error", message: handsFreeError });
            return;
          }
          onHandsFreeCaptured(binding);
        } else {
          onDictationCaptured(binding);
          if (
            handsFreeDraft &&
            (shortcutAlreadyInUse(handsFreeDraft, binding) ||
              handsFreeSharesKey(handsFreeDraft, binding, actionBinding) ||
              handsFreeFnTaken(handsFreeDraft, binding))
          ) {
            toast({
              type: "info",
              message:
                "Your hands-free shortcut was removed because it conflicted with the new push to talk shortcut.",
            });
            onHandsFreeConflict();
          }
        }
      } finally {
        abortRef.current = null;
        if (releaseShortcutRecording(recorderId.current)) {
          window.electron?.dictation?.resumeHotkey?.();
        }
        setCapturing(null);
        setProgress(null);
      }
    },
    [
      actionModeAvailable,
      actionShortcut,
      draft,
      handsFreeDraft,
      onDictationCaptured,
      onHandsFreeCaptured,
      onHandsFreeConflict,
      platform,
      polishShortcut,
      recorderId,
    ],
  );

  const handleCancelCapture = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // A pending capture owns the window's key listeners and holds the global
  // hotkey paused, so leaving the modal has to end it rather than let it run
  // on to its timeout.
  useEffect(
    () => () => {
      handleCancelCapture();
      if (releaseShortcutRecording(recorderId.current)) {
        window.electron?.dictation?.resumeHotkey?.();
      }
    },
    [handleCancelCapture, recorderId],
  );

  return {
    capturing,
    handleCancelCapture,
    handleRecord,
    progress,
  };
}

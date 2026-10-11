import { useEffect, useRef, useState } from "react";
import { type DictationBinding } from "electron/src/dictation/dictation-binding";
import { reservedShortcutError } from "electron/src/dictation/reserved-shortcuts";
import { shortcutTakenError } from "electron/src/dictation/shortcut-conflict";
import { getDictationBindingKeycaps } from "electron/src/dictation/shortcut-keys";
import { getActualPlatform } from "@/utils/device";
import { captureDictationShortcut } from "./captureDictationShortcut";
import {
  findShortcutConflict,
  type ShortcutConflict,
} from "./shortcutConflictRole";
import {
  isShortcutRecordingBusy,
  releaseShortcutRecording,
  subscribeShortcutRecordingBusy,
  tryAcquireShortcutRecording,
} from "./shortcutRecordingLock";
import { subscribeShortcutStatusReset } from "./shortcutStatusReset";

export interface ShortcutRecorderStatus {
  kind: "error" | "idle" | "listening";
  message: string;
}

interface UseShortcutRecorderOptions {
  /** Accept Fn on its own. Polish needs a key alongside Fn. */
  allowBareFn?: boolean;
  conflicts: ShortcutConflict[];
  /** Reshapes what the recorder heard into the binding this shortcut stores. */
  fromCapture?: (binding: DictationBinding) => DictationBinding;
  onCaptured: (binding: DictationBinding) => void;
  validateBinding?: (binding: DictationBinding) => string | null;
}

const IDLE: ShortcutRecorderStatus = { kind: "idle", message: "" };

export function useShortcutRecorder({
  allowBareFn,
  conflicts,
  fromCapture,
  onCaptured,
  validateBinding,
}: UseShortcutRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [peerRecording, setPeerRecording] = useState(isShortcutRecordingBusy);
  const [progress, setProgress] = useState<DictationBinding | null>(null);
  const [status, setStatus] = useState<ShortcutRecorderStatus>(IDLE);
  const recordingRef = useRef(false);
  const recorderId = useRef(Symbol("shortcut-recorder"));
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const id = recorderId.current;
    const unsubscribe = subscribeShortcutRecordingBusy(setPeerRecording);
    const unsubscribeStatusReset = subscribeShortcutStatusReset(() => {
      setStatus(IDLE);
    });
    return () => {
      unsubscribe();
      unsubscribeStatusReset();
      abortRef.current?.abort();
      if (releaseShortcutRecording(id)) {
        window.electron?.dictation?.resumeHotkey?.();
      }
    };
  }, []);

  /** Commits a chord unless another shortcut already holds it. */
  const apply = (binding: DictationBinding) => {
    const conflict = findShortcutConflict(binding, conflicts);
    if (conflict) {
      setStatus({
        kind: "error",
        message: conflict.message ?? shortcutTakenError(conflict.role),
      });
      return;
    }
    onCaptured(binding);
    setStatus(IDLE);
  };

  const record = async () => {
    if (recordingRef.current) return;
    const abort = new AbortController();
    abortRef.current = abort;
    if (!tryAcquireShortcutRecording(recorderId.current)) {
      abortRef.current = null;
      return;
    }
    recordingRef.current = true;
    setIsRecording(true);
    setProgress(null);
    setStatus({
      kind: "listening",
      message: "Press a key or a side mouse button. Esc cancels.",
    });
    window.electron?.dictation?.pauseHotkey?.();
    try {
      const result = await captureDictationShortcut({
        allowBareFn,
        onProgress: setProgress,
        signal: abort.signal,
      });
      if (result.error || !result.binding) {
        if (abort.signal.aborted) {
          setStatus(IDLE);
          return;
        }
        setStatus({
          kind: "error",
          message: result.error ?? "Couldn't capture that shortcut.",
        });
        return;
      }
      const binding = fromCapture?.(result.binding) ?? result.binding;
      const reserved = reservedShortcutError(binding, getActualPlatform());
      if (reserved) {
        setStatus({ kind: "error", message: reserved });
        return;
      }
      const unusable = validateBinding?.(binding);
      if (unusable) {
        setStatus({ kind: "error", message: unusable });
        return;
      }
      apply(binding);
    } finally {
      abortRef.current = null;
      if (releaseShortcutRecording(recorderId.current)) {
        window.electron?.dictation?.resumeHotkey?.();
      }
      recordingRef.current = false;
      setIsRecording(false);
      setProgress(null);
    }
  };

  const isMac = getActualPlatform() === "darwin";
  const progressKeycaps = progress
    ? getDictationBindingKeycaps(progress, { isMac })
    : [];

  return {
    isLocked: peerRecording,
    isRecording,
    progressKeycaps,
    cancel: () => abortRef.current?.abort(),
    clearStatus: () => setStatus(IDLE),
    record: () => {
      void record();
    },
    status,
  };
}

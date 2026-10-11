import { isDesktop } from "@/utils/device";
import { useEffect, useEffectEvent } from "react";
import type { RecordingTriggerPayload } from "electron/src/types";

interface UseRecordingListenerProps {
  onStartRecording: (payload?: RecordingTriggerPayload) => void;
}

// Module-level dedup: prevents duplicate start-recording events across all
// hook instances (e.g. during React remounts or if multiple windows receive
// the same IPC broadcast). Keyed by source so different triggers aren't suppressed.
const DEDUP_WINDOW_MS = 2000;
const lastStartBySource = new Map<string, number>();

/**
 * Hook to listen for recording events from the main process (e.g., tray menu)
 */
export const useDesktopTrayMenuListener = ({
  onStartRecording,
}: UseRecordingListenerProps) => {
  const onStart = useEffectEvent(onStartRecording);

  useEffect(() => {
    // Only available on desktop platforms with Electron
    if (!isDesktop) {
      return;
    }

    if (!window.electron?.recording) {
      console.error(
        "[useRecordingListener] window.electron.recording is not available",
      );
      return;
    }

    console.log("[useRecordingListener] Setting up listener");

    const cleanup = window.electron.recording.onStartRecording((payload) => {
      const now = performance.now();
      const source = payload?.source ?? "unknown";
      const lastTime = lastStartBySource.get(source) ?? -Infinity;

      if (now - lastTime < DEDUP_WINDOW_MS) {
        return;
      }
      lastStartBySource.set(source, now);

      onStart(payload);
    });

    return cleanup;
  }, []);
};

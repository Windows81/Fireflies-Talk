import { useCallback, useEffect, useState } from "react";
import { Logger } from "@/logger";
import {
  syncPuppetAction,
  updatePuppetStatus,
  type PuppetActionName,
} from "@/features/live-record/puppet-sync";
import { isDesktop } from "@/utils/device";

const logger = new Logger("usePuppetPauseState");

type RecordingState = "inactive" | "recording" | "paused" | undefined;

interface UsePuppetPauseStateOptions {
  meetingId: string;
  hasPuppet: boolean;
  recordingState: RecordingState;
}

interface UsePuppetPauseStateResult {
  isPaused: boolean;
  togglePause: () => void;
}

export function usePuppetPauseState({
  meetingId,
  hasPuppet,
  recordingState,
}: UsePuppetPauseStateOptions): UsePuppetPauseStateResult {
  const [isPaused, setIsPaused] = useState(() => recordingState === "paused");

  // Reconcile from IPC recordingState (authoritative local state from main window)
  useEffect(() => {
    if (recordingState === undefined) return;
    setIsPaused(recordingState === "paused");
  }, [recordingState]);

  const togglePause = useCallback(() => {
    if (!isDesktop || !window.electron?.recordingContext || !meetingId) {
      logger.warn("No recording context available for pause/resume");
      return;
    }

    const action: PuppetActionName = isPaused
      ? "resume_recording"
      : "pause_recording";

    logger.info("[usePuppetPauseState] togglePause", {
      isPaused,
      action,
      meetingId,
    });

    // Optimistic update
    setIsPaused(action === "pause_recording");

    // Send IPC to main window to toggle local recording pause/resume
    window.electron.recordingContext.togglePauseResume();

    // Sync puppet server state only when a puppet bot is active.
    // IPC toggle is independent — local recording state is authoritative via
    // the reconciliation effect above. Server sync is fire-and-forget; errors
    // are handled by syncPuppetAction itself (toast + Sentry).
    if (hasPuppet) {
      const targetStatus = action === "pause_recording" ? "paused" : "active";
      void syncPuppetAction(action, meetingId)
        .then(() => {
          updatePuppetStatus(meetingId, targetStatus);
        })
        .catch(() => {});
    }
  }, [isPaused, meetingId, hasPuppet]);

  return { isPaused, togglePause };
}

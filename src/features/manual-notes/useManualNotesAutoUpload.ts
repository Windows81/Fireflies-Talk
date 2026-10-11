import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  forgetUploadedSnapshot,
  uploadManualNotesForMeeting,
} from "./uploadManualNotesForMeeting";

interface UseManualNotesAutoUploadArgs {
  meetingId: string;
  isMeetingEnded: boolean;
  /**
   * Whether unmounting may drop the local draft after flushing it. Pass false
   * on surfaces that unmount while the meeting is still live (e.g. the
   * floating card, torn down on app background), where clearing would wipe
   * the notes out from under the user on remount.
   */
  clearOnUnmount?: boolean;
}

const PERIODIC_FLUSH_INTERVAL_MS = 60_000;

/**
 * Flushes the persisted manual-notes draft for the active meeting:
 *  - When the meeting transitions to ended (or is already ended on mount).
 *  - When the renderer/window is about to be unloaded while still live.
 *  - Periodically (every 60s) while the meeting is live, so partial
 *    progress survives a crash. The upload itself short-circuits when
 *    notes + shouldMerge haven't changed since the last successful
 *    upload, so idle meetings make no network calls.
 *
 * The draft is kept in localStorage / MMKV until the upload succeeds, so a
 * crash or transient failure can't lose the user's notes — the next mount
 * will retry through the same lifecycle.
 *
 * A no-op without a draft, so mounting it unconditionally is harmless.
 */
export const useManualNotesAutoUpload = ({
  meetingId,
  isMeetingEnded,
  clearOnUnmount = true,
}: UseManualNotesAutoUploadArgs) => {
  // Read through a ref so the unmount flush honors the latest value without
  // re-running the effect (which would flush-with-clear mid-life on a flip).
  const clearOnUnmountRef = useRef(clearOnUnmount);
  clearOnUnmountRef.current = clearOnUnmount;

  // Sends what the user typed as soon as the meeting ends, but keeps the local
  // draft: the recording UI is still on screen at this point, and wiping the
  // notes out from under the user reads as losing them.
  useEffect(() => {
    if (!isMeetingEnded || !meetingId) return;
    void uploadManualNotesForMeeting(meetingId, { clearOnSuccess: false });
  }, [isMeetingEnded, meetingId]);

  useEffect(() => {
    if (!meetingId) return;
    if (Platform.OS !== "web") return;

    const handler = () => {
      void uploadManualNotesForMeeting(meetingId);
    };

    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, [meetingId]);

  // Mid-meeting periodic sync. Leaves the local draft in place
  // (`clearOnSuccess: false`) so the user keeps seeing what they typed.
  useEffect(() => {
    if (!meetingId) return;
    if (isMeetingEnded) return;

    const intervalId = setInterval(() => {
      void uploadManualNotesForMeeting(meetingId, { clearOnSuccess: false });
    }, PERIODIC_FLUSH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [meetingId, isMeetingEnded]);

  // The recorder has moved on from this meeting, so the draft has done its
  // job on screen. Flush once more with clearing on: an already-uploaded
  // draft short-circuits and is dropped, and one that never made it is
  // retried and only dropped once the server has it.
  useEffect(() => {
    if (!meetingId) return;
    return () => {
      if (!clearOnUnmountRef.current) {
        void uploadManualNotesForMeeting(meetingId, { clearOnSuccess: false });
        return;
      }
      void uploadManualNotesForMeeting(meetingId).finally(() => {
        forgetUploadedSnapshot(meetingId);
      });
    };
  }, [meetingId]);
};

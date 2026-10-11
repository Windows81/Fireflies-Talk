import {
  claimPendingRecordingNotes,
  useManualNotesAutoUpload,
} from "@/features/manual-notes";
import { useEffect, type FC } from "react";
import { useRecorder } from "../record.store";
import { LiveRecordFloatingCard } from "./LiveRecordFloatingCard";
import { LiveRecordInterruptListener } from "./LiveRecordInterruptListener";

export const LiveRecordController: FC = () => {
  const meetingId = useRecorder((s) => s.context?.meetingId);
  const fileUri = useRecorder((s) => s.context?.fileUri);
  const recordingState = useRecorder((s) => s.status.state);

  // Navigator-level so notes flushes survive leaving the Record screen; the
  // upload dedupe makes any double-mount harmless.
  useManualNotesAutoUpload({
    meetingId: meetingId ?? "",
    isMeetingEnded: recordingState === "inactive",
  });

  // Notes typed before the recording had a meeting live under a pending key.
  // Owned here rather than by the notes UI, which unmounts whenever the card
  // is collapsed — the handoff has to happen wherever the user is. A recording
  // started offline has no meeting yet, so its notes wait under the file uri.
  useEffect(() => {
    const recordingKey = meetingId ?? fileUri;
    if (!recordingKey) return;
    claimPendingRecordingNotes(recordingKey);
  }, [meetingId, fileUri]);

  return (
    <>
      <LiveRecordInterruptListener />
      <LiveRecordFloatingCard />
    </>
  );
};

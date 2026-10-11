import { PROCESS_MEETING_STATUS } from "@/constants";
import type { DesktopNotepadMeeting, TranscriptStatus } from "../types";

// Captions present always win; otherwise the reason is derived from process status + audio metadata.
export function getTranscriptStatus(
  meeting: DesktopNotepadMeeting,
): TranscriptStatus {
  if (meeting.captions?.length) return "ready";

  const status = meeting.processMeetingStatus;
  if (
    status === PROCESS_MEETING_STATUS.STARTED ||
    status === PROCESS_MEETING_STATUS.NOT_STARTED
  ) {
    return "transcribing";
  }
  if (status === PROCESS_MEETING_STATUS.FAILED) return "failed";
  if (meeting.audioService_metadata?.silentMeeting) return "silent";

  return "not-transcribed";
}

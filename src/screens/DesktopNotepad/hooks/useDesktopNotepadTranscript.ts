import type { Caption } from "@/features/transcript";
import { useMemo } from "react";
import { processCaptionsForFilter } from "@/screens/Notepad/utils/captions";
import { getTranscriptStatus } from "../helpers/transcriptStatus";
import type { DesktopNotepadMeeting, TranscriptStatus } from "../types";

export interface DesktopNotepadTranscriptState {
  status: TranscriptStatus;
  captions: Caption[];
}

export function useDesktopNotepadTranscript(
  meeting: DesktopNotepadMeeting,
): DesktopNotepadTranscriptState {
  const status = getTranscriptStatus(meeting);

  const captions = useMemo<Caption[]>(() => {
    if (!meeting.captions?.length) return [];
    let result: Caption[] = [];
    processCaptionsForFilter(meeting.captions, (next) => {
      result = next;
    });
    return result;
  }, [meeting.captions]);

  return { status, captions };
}

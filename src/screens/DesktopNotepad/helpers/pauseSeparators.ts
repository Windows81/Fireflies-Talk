import type { TranscriptSeparator } from "@/components/Transcript";
import type { DesktopNotepadMeeting } from "../types";

/**
 * Build recording-pause separators from the meeting's puppet states. A `PAUSED`
 * state carries the transcript-relative `time` it occurred and `timeSpent`, the
 * pause duration (computed server-side, mirroring dashboard-ff).
 */
export function getPauseSeparators(
  meeting: Pick<DesktopNotepadMeeting, "puppetStates">,
): TranscriptSeparator[] {
  const states = meeting.puppetStates;
  if (!states?.length) return [];

  return states
    .filter((state) => state?.status === "PAUSED" && state.time != null)
    .map((state) => ({
      id: `pause-${state!.time}`,
      time: state!.time ?? 0,
      durationSec: state!.timeSpent ?? 0,
    }));
}

import { SKIP_SUMMARY_REASONS } from "@/constants";
import { MeetingSummaryStatus } from "@/graphql";
import type { DesktopNotepadMeeting, SummaryUnavailableReason } from "../types";

// Null means the summary can still arrive, so the caller keeps its loading UI.
export function getSummaryUnavailableReason(
  meeting: DesktopNotepadMeeting,
  summaryStatus: MeetingSummaryStatus | null | undefined,
): SummaryUnavailableReason | null {
  if (summaryStatus === MeetingSummaryStatus.Failed) return "failed";
  if (summaryStatus !== MeetingSummaryStatus.Skipped) return null;
  if (meeting.audioService_metadata?.silentMeeting) return "silent";
  if (
    meeting.audioService_metadata?.skipSummaryReason?.includes(
      SKIP_SUMMARY_REASONS.NOT_ENOUGH_CAPTIONS,
    )
  ) {
    return "not-enough-transcript";
  }
  return "skipped";
}

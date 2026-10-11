import { useQuery } from "@apollo/client";
import { GetMeetingSummaryQueryDocument } from "@firefliesai/mobile-ff.graphql-client";
import type { MeetingSummaryStatus } from "@firefliesai/mobile-ff.graphql-client";
import { useMemo } from "react";
import { SummarySectionKey } from "@/constants/ai";
import { wrapManualNotes } from "@/screens/Notepad/utils/manual-notes";
import { transformContent } from "@/screens/Notepad/utils/transform-content";
import type { DesktopNotepadMeeting, DesktopNotepadSection } from "../types";

export interface DesktopNotepadSummaryState {
  sections: DesktopNotepadSection[];
  loading: boolean;
  summaryStatus: MeetingSummaryStatus | null | undefined;
}

// Meeting notes are markdown strings; timestamps are linkified via transformContent.
export function useDesktopNotepadSummary(
  meeting: DesktopNotepadMeeting,
): DesktopNotepadSummaryState {
  const { data, loading } = useQuery(GetMeetingSummaryQueryDocument, {
    variables: { meetingId: meeting.id },
  });

  const sections = useMemo<DesktopNotepadSection[]>(() => {
    const raw = data?.meetingSummary?.sections ?? [];
    return (
      raw
        // Action items live in the dedicated Tasks tab, so drop that section from
        // the general summary to avoid duplicating them.
        .filter(
          (section) =>
            !!section.value && section.key !== SummarySectionKey.ACTION_ITEMS,
        )
        .map((section) => ({
          key: section.key,
          title: section.title,
          rawValue: section.value as string,
          value: wrapManualNotes(
            transformContent(meeting, section.value as string),
          ),
        }))
    );
  }, [data?.meetingSummary?.sections, meeting]);

  return {
    sections,
    loading,
    summaryStatus: data?.meetingSummary?.summaryStatus,
  };
}

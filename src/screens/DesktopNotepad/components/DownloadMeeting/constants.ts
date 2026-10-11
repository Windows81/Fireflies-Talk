import { MEETING_SOURCE } from "@/features/meeting";
import { MeetingSummaryStatus } from "@firefliesai/mobile-ff.graphql-client";
import type { DesktopNotepadMeeting } from "../../types";

export type DownloadTabValue = "transcript" | "summary" | "video" | "audio";

export interface DownloadTabConfig {
  title: string;
  value: DownloadTabValue;
  formats: string[];
}

export const DOWNLOAD_TABS: DownloadTabConfig[] = [
  {
    title: "Transcript",
    value: "transcript",
    formats: ["DOCX", "PDF", "SRT", "CSV", "JSON"],
  },
  {
    title: "Summary",
    value: "summary",
    formats: ["DOCX", "PDF", "JSON", "MD"],
  },
  { title: "Video", value: "video", formats: ["MP4"] },
  { title: "Audio", value: "audio", formats: ["MP3"] },
];

// A tab is offered only when the meeting holds the matching artifact. Audio is
// hidden for desktop recordings (their audio isn't a downloadable artifact).
export const getValidDownloadTabs = (
  meeting: DesktopNotepadMeeting,
): DownloadTabConfig[] =>
  DOWNLOAD_TABS.filter((tab) => {
    switch (tab.value) {
      case "transcript":
        return !!meeting.captions?.length;
      case "summary":
        return meeting.summaryStatus === MeetingSummaryStatus.Processed;
      case "video":
        return !!meeting.video_url;
      case "audio":
        return (
          !!meeting.audio_url &&
          meeting.addedBy !== MEETING_SOURCE.DESKTOP_RECORD
        );
      default:
        return false;
    }
  });

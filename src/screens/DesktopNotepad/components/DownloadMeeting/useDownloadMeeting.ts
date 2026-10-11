import { Config } from "@/constants";
import {
  generateMeetingSlug,
  generateSummaryFileName,
  performDownload,
  type DownloadOptions,
} from "@/features/meeting/utils/download";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { triggerDownloadFile } from "@/utils/file";
import { useState } from "react";
import { getNotepadTitle } from "../../helpers/meeting";
import type { DesktopNotepadMeeting } from "../../types";
import type { DownloadTabValue } from "./constants";

export interface DownloadParams {
  tab: DownloadTabValue;
  format: string;
  includeTimestamp: boolean;
  includeSpeaker: boolean;
  includeAIApps: boolean;
  removeBranding: boolean;
}

export const useDownloadMeeting = (
  meeting: DesktopNotepadMeeting,
  close: () => void,
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const slug = generateMeetingSlug(getNotepadTitle(meeting));

  const downloadTranscript = (params: DownloadParams) => {
    const format = params.format.toLowerCase();
    const options: DownloadOptions = {
      url: `${Config.DOWNLOAD_URL}/download/${format}/${slug}/${meeting.id}`,
      requestBody: {
        speaker: params.includeSpeaker,
        // SRT subtitles are meaningless without cue timings.
        timestamp: format === "srt" ? true : params.includeTimestamp,
        removeBranding: params.removeBranding,
      },
      downloadType: "transcript",
      format: params.format,
      errorTitle: "Could not download transcript",
    };

    return performDownload(
      options,
      meeting,
      "transcript",
      setIsProcessing,
      close,
    );
  };

  const downloadSummary = (params: DownloadParams) => {
    const format = params.format.toLowerCase();
    const options: DownloadOptions = {
      url: `${Config.DOWNLOAD_URL}/summary/${format}/${meeting.id}`,
      requestBody: {
        withAIApps: params.includeAIApps,
        withTimestamps: params.includeTimestamp,
        removeBranding: params.removeBranding,
      },
      downloadType: "summary",
      format: params.format,
      errorTitle: "Could not download summary",
      fileName: generateSummaryFileName(meeting, format),
    };

    return performDownload(options, meeting, "summary", setIsProcessing, close);
  };

  const downloadMedia = (sourceType: "audio" | "video") => {
    const url = sourceType === "audio" ? meeting.audio_url : meeting.video_url;
    if (!url) return;
    triggerDownloadFile(url);
    tracker.track(TRACKING_EVENTS.USER_DOWNLOADED_RECORDING, {
      meetingId: meeting.id,
      sourceType,
    });
    close();
  };

  const download = (params: DownloadParams) => {
    if (isProcessing) return;
    switch (params.tab) {
      case "transcript":
        return downloadTranscript(params);
      case "summary":
        return downloadSummary(params);
      case "video":
        return downloadMedia("video");
      case "audio":
        return downloadMedia("audio");
    }
  };

  return { isProcessing, download };
};

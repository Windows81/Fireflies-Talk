import { toast } from "@/components/Toast";
import {
  NetworkError,
  captureException,
  getResponseErrorMessage,
} from "@/errors";
import { authApi } from "@/features/auth";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { getTimeZone } from "@/utils/device";
import { shareFile, triggerDownloadFile } from "@/utils/file";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { File, Paths } from "expo-file-system";
import { getLocales } from "expo-localization";
import { Platform } from "react-native";

export interface DownloadOptions {
  url: string;
  requestBody: Record<string, boolean | string | number>;
  downloadType: "transcript" | "summary";
  format: string;
  errorTitle: string;
  fileName?: string;
}

export const performDownload = async (
  options: DownloadOptions,
  meeting: Pick<Meeting, "id">,
  type: "summary" | "transcript",
  setIsProcessing: (processing: boolean) => void,
  close: () => void,
) => {
  try {
    setIsProcessing(true);
    const res = await fetch(options.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await authApi.getOrRefreshAuthHeaders()),
      },
      body: JSON.stringify({
        ...options.requestBody,
        timezone: getTimeZone() ?? undefined,
      }),
      credentials: "include",
    }).catch(() => {
      throw new NetworkError();
    });

    if (!res.ok) {
      throw new Error(await getResponseErrorMessage(res));
    }

    if (options.downloadType === "transcript") {
      const json = await res.json();
      if (!json.ok) {
        throw new Error(`Download failed: Received non-ok status`);
      }
      triggerDownloadFile(json.downloadUrl);
    } else {
      // Summary download handling
      const contentType =
        res.headers.get("content-type") || "application/octet-stream";
      const fileName = options.fileName;
      if (!fileName) {
        throw new Error("fileName is required for summary downloads");
      }

      if (Platform.OS === "web") {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(
          new Blob([blob], { type: contentType }),
        );
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        link.onload = link.onerror = () => {
          URL.revokeObjectURL(blobUrl);
        };
      } else {
        const arrayBuffer = await res.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const file = new File(Paths.cache, fileName);
        file.write(uint8Array);

        await shareFile(file.uri);
      }
    }

    tracker.track(TRACKING_EVENTS.USER_DOWNLOADED_TRANSCRIPT, {
      meetingId: meeting.id,
      transcriptFormat: options.format,
      downloadType: type,
    });

    close();
  } catch (error) {
    captureException(error, {
      contexts: {
        download: {
          type: options.downloadType,
          format: options.format,
          meetingId: meeting.id,
        },
      },
      tags: {
        meetingId: meeting.id,
        section: "meeting-download-dialog",
      },
    });

    toast({
      title: options.errorTitle,
      message: error.message,
      type: "error",
    });
  } finally {
    setIsProcessing(false);
  }
};

export const generateSummaryFileName = (
  meeting: Pick<Meeting, "title" | "startTime" | "endTime">,
  format: string,
): string => {
  const meetingDate = meeting.startTime || meeting.endTime || new Date();
  const regionCode = getLocales()[0]?.regionCode || "en-US";
  const formattedDate = new Date(meetingDate).toLocaleDateString(regionCode, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  return `${generateMeetingSlug(meeting.title)} ${formattedDate}.${format.toLowerCase()}`;
};

export const generateMeetingSlug = (title: string): string => {
  return title.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-");
};

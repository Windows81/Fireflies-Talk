import { useAuth } from "@/features/auth";
import { useEffect, useState } from "react";
import type { DownloadPayload } from "./fs";
import { getMediaUri, readPayload } from "./fs";
import { useDownloads } from "./store";
import { DownloadStatus } from "./types";

/**
 * Offline read path: the payload + local media of a fully downloaded meeting,
 * or nulls when there is no complete download owned by the current user.
 */
export function useDownloadedMeetingPayload(meetingId: string): {
  payload: DownloadPayload | null;
  mediaFileType: "video" | "audio" | null;
  localMediaUri: string | null;
} {
  const entry = useDownloads((s) =>
    s.index.find((e) => e.meetingId === meetingId),
  );
  const userId = useAuth((s) => s.user?.id);
  const isReadable =
    entry?.userId === userId && entry?.status.state === DownloadStatus.COMPLETE;
  const [payload, setPayload] = useState<DownloadPayload | null>(null);

  useEffect(() => {
    if (!isReadable) return;
    let cancelled = false;
    void readPayload(meetingId).then((result) => {
      if (!cancelled) setPayload(result);
    });
    return () => {
      cancelled = true;
    };
  }, [meetingId, isReadable]);

  if (!isReadable || entry.status.state !== DownloadStatus.COMPLETE) {
    return { payload: null, mediaFileType: null, localMediaUri: null };
  }
  const mediaFileType =
    entry.status.fileType === "json" ? null : entry.status.fileType;

  return {
    payload,
    mediaFileType,
    localMediaUri: mediaFileType ? getMediaUri(meetingId, mediaFileType) : null,
  };
}

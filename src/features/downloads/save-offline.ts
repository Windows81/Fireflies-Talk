import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useAuth } from "@/features/auth";
import { getNetworkStateAsync, NetworkStateType } from "@/utils/network";
import { deleteMediaFile, readPayload } from "./fs";
import { enqueueDownload } from "./queue";
import { downloadsApi } from "./store";
import type { SourceSnapshot } from "./types";
import { DownloadStatus } from "./types";

export function snapshotFromMeeting(meeting: Meeting): SourceSnapshot {
  return {
    id: meeting.id,
    parseId: meeting.id,
    title: meeting.title,
    date: meeting.startTime ?? null,
    startTime: meeting.startTime ?? null,
    creator_email: meeting.organizerEmail,
    owner: meeting.owner ?? null,
    addedBy: meeting.addedBy ?? null,
  };
}

export type SaveOfflineOutcome =
  | "queued"
  | "saved"
  | "needs-cellular-video-confirmation";

/**
 * "Save offline": an existing download flips to a user-owned save, anything
 * else enqueues a manual download, and an audio-only copy of a meeting that
 * has video upgrades to video — asking first on mobile data.
 */
export async function saveOffline(
  meeting: Meeting,
  options?: { allowCellularVideo?: boolean },
): Promise<SaveOfflineOutcome> {
  const entry = downloadsApi.find(meeting.id);
  // a manual save belongs to whoever tapped it, even over a cached copy
  // another account left on this device
  const userId = useAuth.getState().user?.id;

  // Not fully downloaded: enqueue flips any partial entry to manual and
  // (re)runs it under manual rules; offline just leaves it queued.
  if (entry?.status.state !== DownloadStatus.COMPLETE) {
    enqueueDownload({
      meetingId: meeting.id,
      isManual: true,
      target: "notebook",
      snapshot: snapshotFromMeeting(meeting),
    });
    return "queued";
  }

  if (!entry.isManual) {
    downloadsApi.upsert({
      ...entry,
      isManual: true,
      userId: userId ?? entry.userId,
    });
  }
  if (entry.status.fileType === "video") return "saved";

  // The menu's meeting (mapped from a Source) carries no video_url; the
  // stored payload knows whether the meeting has video.
  const payload = await readPayload(meeting.id);
  const hasVideo = Boolean(payload?.meeting?.video_url ?? meeting.video_url);
  if (!hasVideo) return "saved";

  const network = await getNetworkStateAsync();
  if (
    network.type === NetworkStateType.CELLULAR &&
    !options?.allowCellularVideo
  ) {
    return "needs-cellular-video-confirmation";
  }

  if (entry.status.fileType === "audio") deleteMediaFile(meeting.id, "audio");
  downloadsApi.upsert({
    ...entry,
    isManual: true,
    userId: userId ?? entry.userId,
    status: { state: DownloadStatus.PENDING },
  });
  enqueueDownload({
    meetingId: meeting.id,
    isManual: true,
    target: entry.target,
    snapshot: entry.snapshot,
  });
  return "queued";
}

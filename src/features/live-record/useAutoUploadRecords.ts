import { useEffect } from "react";
import { Logger } from "@/logger";
import { uploadApi, useUpload } from "@/features/upload";
import { fileExists } from "@/utils/file";
import { addNetworkStateListener } from "@/utils/network";
import { localRecordStoreApi, useLocalRecordStore } from "./local-record.store";
import { ensureRecordingMeetingId } from "./ensure-upload";
import { useAuth } from "../auth";
import { useRecorder } from "./record.store";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { Platform } from "react-native";
import { isDesktop } from "@/utils/device";
import { isMainDesktopWindow } from "@/utils/device";

const logger = new Logger("auto-upload");
const DAYS_TO_TRY_UPLOAD = 15 * 24 * 60 * 60 * 1000; // 15 days
const SYNC_TIMEOUT_MS = 5000; // 5 seconds

/** The file being captured right now, which is still growing on disk. */
function getRecordingFileUri(): string | undefined {
  const { status, context } = useRecorder.getState();
  return status.state === "inactive" ? undefined : context?.fileUri;
}

let inflight: Promise<void> | null = null;

/** Single-flight: a flapping connection can fire the listener twice, and two
 * concurrent runs would each create a meeting for the same file. */
function uploadPendingRecordings(): Promise<void> {
  inflight ??= runUploadPendingRecordings().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function runUploadPendingRecordings() {
  try {
    const now = Date.now();
    const recordingFileUri = getRecordingFileUri();
    const { recordings } = useLocalRecordStore.getState();
    const existingUploads = useUpload.getState().uploads;
    const scheduledMeetingIds = new Set<string>();

    for (const rec of recordings) {
      const recTime = rec.endTime ?? rec.startTime ?? 0;
      if (!recTime) continue;
      if (now - recTime > DAYS_TO_TRY_UPLOAD) continue;
      if (rec.streamed === true) continue;
      if (rec.uploaded === true) continue;
      if (recordingFileUri && rec.fileUris?.includes(recordingFileUri))
        continue;

      const meetingId = rec.meetingId;
      const alreadyInQueue =
        meetingId &&
        (scheduledMeetingIds.has(meetingId) ||
          existingUploads.some((u) => u.id === meetingId));
      if (alreadyInQueue) continue;

      const fileUri =
        Array.isArray(rec.fileUris) && rec.fileUris.length > 0
          ? rec.fileUris[rec.fileUris.length - 1]
          : undefined;
      if (!fileUri) continue;
      const isFileExists = await fileExists(fileUri);
      if (!isFileExists) {
        localRecordStoreApi.removeByUri(fileUri);
        continue;
      }

      let ensuredMeetingId: string;
      try {
        ensuredMeetingId = await ensureRecordingMeetingId({ ...rec, fileUri });
      } catch (err) {
        logger.error("failed to create meeting for auto-upload", {
          err,
          fileUri,
        });
        continue;
      }

      try {
        scheduledMeetingIds.add(ensuredMeetingId);
        await uploadApi.create(fileUri, {
          title: rec.title || "Recording",
          meetingId: ensuredMeetingId,
          uploadType: "recording",
          durationMillis: rec.durationMillis,
          audioSamplingRate: rec.audioSamplingRate,
          onCompleted() {
            localRecordStoreApi.updateByMeetingId(ensuredMeetingId, {
              uploaded: true,
            });
            tracker.track(TRACKING_EVENTS.AUDIO_RECORD_UPLOAD_COMPLETED, {
              meetingId: ensuredMeetingId,
              durationMins: (rec.durationMillis ?? 0) / 60000,
              fromDashboard: Platform.OS === "web",
              fromAutoUpload: true,
            });
          },
          onError(err) {
            scheduledMeetingIds.delete(ensuredMeetingId);
            logger.error("upload task failed", {
              err,
              fileUri,
              meetingId: ensuredMeetingId,
            });
          },
        });
      } catch (err) {
        logger.error("failed to enqueue upload", {
          err,
          fileUri,
          meetingId: ensuredMeetingId,
        });
      }
    }
  } catch (err) {
    logger.error("unexpected error while scheduling upload", { err });
  }
}

/**
 * Auto-upload hook that enqueues pending local recordings for upload.
 *
 * Business Logic:
 * - Scans local record store for recordings from the last 15 days
 * - Filters out recordings that are already streamed or uploaded
 * - Skips the recording currently being captured
 * - Skips recordings already in the upload queue
 * - Validates file existence before enqueueing (removes invalid entries)
 * - Creates missing meeting IDs (recordings started offline have none)
 * - Enqueues uploads using the legacy uploadApi.create system
 *
 * Timing:
 * - Waits 5 seconds after mount to allow native module context sync
 * - This prevents conflicts with ongoing recordings that may be running
 *   via Android foreground services even if JS context is lost
 * - Re-scans when connectivity comes back, so a recording made in airplane
 *   mode uploads without waiting for a relaunch
 *
 * Desktop:
 * - On desktop platforms, auto-upload only runs in the main window
 * - Other desktop windows skip auto-upload to prevent duplicate uploads
 */
export const useAutoUploadRecords = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (isDesktop && !isMainDesktopWindow()) return;

    const timeoutId = setTimeout(
      () => void uploadPendingRecordings(),
      SYNC_TIMEOUT_MS,
    );

    let wasOffline = false;
    const networkSubscription = addNetworkStateListener((state) => {
      const isOnline = state.isInternetReachable === true;
      if (wasOffline && isOnline) void uploadPendingRecordings();
      wasOffline = state.isInternetReachable === false;
    });

    return () => {
      clearTimeout(timeoutId);
      networkSubscription.remove();
    };
  }, [user]);
};

import { captureException } from "@/errors";
import { Logger } from "@/logger";
import { getFileInfo, uploadFile } from "@/utils/file";
import type { CaptureContext } from "@sentry/core";
import { create } from "zustand";
import { MAX_RETRY_COUNT } from "./constants";
import type { UploadTaskDetail } from "./types";
import type { UploadCompletePayload } from "./utils";
import { completeUpload, createUserFile, getUploadAndMediaUrl } from "./utils";

interface UploadStoreValue {
  uploads: UploadTaskDetail[];
  create: (
    file: string | { uri: string; mimeType: string; size: number },
    options: {
      onCompleted?: (task: UploadTaskDetail) => void;
      onError?: (error: Error) => void;
      meetingId: string;
      title: string;
      uploadType?: "file" | "recording";
      durationMillis?: number;
      audioSamplingRate?: number;
    },
  ) => Promise<{ mimeType: string; size: number }>;
  update: (id: string, partial: Partial<UploadTaskDetail>) => void;
  cancel: (task: UploadTaskDetail) => void;
  retry: (task: UploadTaskDetail) => Promise<void>;
}

const TAG = "upload";

const logger = new Logger(TAG);

export const useUpload = create<UploadStoreValue>()((set, get) => ({
  uploads: [],
  async create(
    file,
    {
      meetingId,
      title,
      uploadType = "file",
      durationMillis,
      audioSamplingRate,
      onCompleted,
      onError,
    },
  ) {
    const { mimeType, size } =
      typeof file === "string" ? await getFileInfo(file, {}) : file;
    const uri = typeof file === "string" ? file : file.uri;

    logger.info("creating upload", {
      uri,
      mimeType,
      size,
      durationMillis,
    });

    const progress = {
      totalBytesSent: 0,
      totalBytesExpectedToSend: size,
    } as UploadTaskDetail["progress"];

    const nextTaskDetail: UploadTaskDetail = {
      id: meetingId,
      title,
      progress,
      fileUri: uri,
      mimeType,
      status: "uploading",
    };

    // Reject if an upload for this meetingId is already tracked
    // (uploading or finalizing). This closes the race window between
    // the caller's check and task registration.
    const existing = get().uploads.find((u) => u.id === meetingId);
    if (existing && existing.status !== "failed") {
      logger.info("duplicate upload rejected", { meetingId });
      return { mimeType, size };
    }

    let retryCount = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const sentryContext = {
      contexts: {
        upload: {
          meetingId,
          title,
          uri,
          mimeType,
          size,
          uploadUrl: "",
        },
      },
      tags: {
        section: TAG,
      },
      fingerprint: ["{{ default }}", "{{ error.value }}"],
    } satisfies CaptureContext;

    async function startUpload() {
      if (nextTaskDetail.cancel) {
        await nextTaskDetail.cancel().catch(() => {});
      }

      logger.info("starting upload", {
        retryCount,
        uri,
        mimeType,
        size,
        meetingId,
        durationMillis,
      });

      clearTimeout(retryTimeout);

      get().update(nextTaskDetail.id, {
        status: "uploading",
      });

      const { uploadUrl, mediaUrl } = await getUploadAndMediaUrl({
        mimeType,
        meetingId,
        size,
      });

      function handleError(err: Error, skipRetry?: boolean) {
        logger.error(`upload error: ${err.message}`, {
          retryCount,
        });

        // retry several times
        if (retryCount < MAX_RETRY_COUNT && !skipRetry) {
          retryCount++;
          // backoff retry
          retryTimeout = setTimeout(() => {
            startUpload().catch(handleError);
          }, 1000 * retryCount);
        } else {
          captureException(err, sentryContext);
          get().update(nextTaskDetail.id, {
            status: "failed",
          });
          onError?.(err);
        }
      }

      const { cancel } = uploadFile(uploadUrl, uri, {
        method: "PUT",
        headers: {
          // Strip codec parameters to match signed URL signature
          // GCS signed URLs are strict about Content-Type matching
          "Content-Type": mimeType.split(";")[0],
        },
        onProgress: (progressData) => {
          progress.totalBytesSent = progressData.totalBytesSent;
        },
        async onComplete() {
          const uploadCompletePayload: UploadCompletePayload = {
            mediaUrl,
            title,
            fileSize: progress.totalBytesExpectedToSend,
            mimeType,
            meetingId,
            audioSamplingRate,
          };

          progress.totalBytesSent = progress.totalBytesExpectedToSend;

          // Keep status as "uploading" during backend finalization so
          // the dedup guard still treats this upload as active.
          try {
            const logContext = {
              fileSize: uploadCompletePayload.fileSize,
              meetingId: uploadCompletePayload.meetingId,
              mimeType: uploadCompletePayload.mimeType,
              title: uploadCompletePayload.title,
            };
            if (uploadType === "recording") {
              logger.info("marking upload as complete", logContext);
              await completeUpload(uploadCompletePayload);
            } else {
              logger.info("creating user file", logContext);
              await createUserFile(uploadCompletePayload);
            }

            // Mark completed after backend confirmation but before
            // onCompleted — callers (e.g. ShareTarget) read the store
            // status inside onCompleted.
            get().update(nextTaskDetail.id, {
              status: "completed",
            });

            onCompleted?.(nextTaskDetail);

            // wait a bit for user acknowledgement and remove the task
            setTimeout(() => {
              set({
                uploads: get().uploads.filter(
                  (t) => t.id !== nextTaskDetail.id,
                ),
              });
            }, 5 * 1000);
          } catch (err) {
            handleError(err, true);
          }
        },
        onError: handleError,
      });

      nextTaskDetail.cancel = cancel;
      // Sync cancel to the store copy (update() spreads a new object,
      // so mutations on the original nextTaskDetail are not reflected).
      get().update(nextTaskDetail.id, { cancel });
    }

    nextTaskDetail.start = startUpload;

    // Register the task before starting so concurrent callers
    // can detect the in-progress upload synchronously. Filter out
    // any stale failed entry for the same meetingId first.
    set({
      uploads: [
        ...get().uploads.filter((u) => u.id !== nextTaskDetail.id),
        nextTaskDetail,
      ],
    });

    try {
      await startUpload();
    } catch (err) {
      set({
        uploads: get().uploads.filter((t) => t.id !== nextTaskDetail.id),
      });
      captureException(err, sentryContext);
      throw err;
    }

    return { mimeType, size };
  },
  update(id, partial) {
    set({
      uploads: get().uploads.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          ...partial,
        };
      }),
    });
  },
  cancel(task) {
    task.cancel?.().catch((err) => {
      captureException(err, {
        contexts: {
          task: {
            startFn: !!task.start,
            cancelFn: !!task.cancel,
            meetingId: task.id,
            title: task.title,
            fileUri: task.fileUri,
            status: task.status,
            progress: task.progress,
          },
        },
        tags: {
          section: TAG,
        },
      });
    });
    task.start = undefined;

    set({
      uploads: get().uploads.filter((t) => t.id !== task.id),
    });
  },
  async retry(task) {
    return task.start?.().catch((err) => {
      get().update(task.id, {
        status: "failed",
      });
      captureException(err, {
        contexts: {
          task: {
            startFn: !!task.start,
            cancelFn: !!task.cancel,
            meetingId: task.id,
            title: task.title,
            fileUri: task.fileUri,
            status: task.status,
            progress: task.progress,
          },
        },
        tags: {
          section: TAG,
        },
      });
      throw err;
    });
  },
}));

export const uploadApi = useUpload.getState() as Omit<
  UploadStoreValue,
  "uploads"
>;

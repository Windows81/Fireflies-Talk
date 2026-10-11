import { useAuth } from "@/features/auth";
import { Logger } from "@/logger";
import { downloadFile, hasMinimumDiskSpace } from "@/utils/file";
import {
  addNetworkStateListener,
  getNetworkStateAsync,
  NetworkStateType,
  type NetworkState,
} from "@/utils/network";
import { deleteDownload } from "./cleanup";
import {
  deleteMediaFile,
  deleteMeetingDir,
  dirSizeBytes,
  getMediaUri,
  writePayload,
} from "./fs";
import { fetchMeetingPayload } from "./payload";
import {
  entryDateMs,
  selectBudgetEvictionMeetingIds,
  selectMediaSource,
} from "./policy";
import { downloadsApi, useDownloads } from "./store";
import type { DownloadEntry, SourceSnapshot } from "./types";
import { DownloadStatus, MediaDownloadMode } from "./types";

const logger = new Logger("download-queue");

const MAX_RETRIES = 3;

const PROGRESS_PERSIST_INTERVAL_MS = 500;
const PROGRESS_PERSIST_STEP = 0.05;

type AbortReason = "user-cancel" | "network-rules" | "cache-cap";

interface ActiveDownload {
  controller: AbortController;
  reason?: AbortReason;
}

const pendingQueue: string[] = [];
const active = new Map<string, ActiveDownload>();
let processing = false;
let capExhausted = false;

export interface EnqueueDownloadInput {
  meetingId: string;
  isManual: boolean;
  target: "notebook" | "feed";
  snapshot: SourceSnapshot;
}

export function enqueueDownload(input: EnqueueDownloadInput) {
  const userId = useAuth.getState().user?.id;
  if (!userId) return;

  const existing = downloadsApi.find(input.meetingId);
  const isManual = input.isManual || (existing?.isManual ?? false);

  if (existing && existing.isManual !== isManual) {
    downloadsApi.upsert({ ...existing, isManual });
  }
  if (existing?.status.state === DownloadStatus.COMPLETE) return;
  if (active.has(input.meetingId) || pendingQueue.includes(input.meetingId)) {
    return;
  }

  downloadsApi.upsert({
    meetingId: input.meetingId,
    userId,
    isManual,
    target: existing?.target === "notebook" ? "notebook" : input.target,
    snapshot: input.snapshot,
    status: { state: DownloadStatus.PENDING },
  });
  pendingQueue.push(input.meetingId);
  void processQueue();
}

// User cancel: stop the transfer and remove every trace of the download.
export function cancelDownload(meetingId: string) {
  const inFlight = active.get(meetingId);
  if (inFlight) {
    inFlight.reason = "user-cancel";
    inFlight.controller.abort();
  }
  const queued = pendingQueue.indexOf(meetingId);
  if (queued >= 0) pendingQueue.splice(queued, 1);
  deleteDownload(meetingId);
}

async function processQueue() {
  if (processing) return;
  processing = true;
  capExhausted = false;
  try {
    while (pendingQueue.length > 0) {
      const meetingId = pendingQueue.shift();
      if (!meetingId) break;
      await processDownload(meetingId).catch((error) => {
        logger.error("download task crashed", { meetingId, error });
      });
    }
  } finally {
    processing = false;
  }
}

// Mid-flight status writes must not clobber concurrent entry updates (e.g. a
// "Save offline" isManual flip) nor resurrect an entry removed by a cancel —
// always re-read the current entry and skip when it's gone.
function upsertStatus(meetingId: string, status: DownloadEntry["status"]) {
  const current = downloadsApi.find(meetingId);
  if (!current) return;
  downloadsApi.upsert({ ...current, status });
}

async function processDownload(meetingId: string) {
  const entry = downloadsApi.find(meetingId);
  if (!entry || entry.status.state === DownloadStatus.COMPLETE) return;

  const network = await getNetworkStateAsync();
  if (network.isInternetReachable === false) {
    // the reconciler re-enqueues FAILED entries when connectivity returns
    upsertStatus(meetingId, { state: DownloadStatus.FAILED });
    return;
  }

  const mode = allowedMediaMode(network, entry.isManual);
  // stays PENDING until a network whose rules allow downloading shows up
  if (mode === MediaDownloadMode.OFF) return;
  if (!entry.isManual && capExhausted) return;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await runDownload(entry, mode);
      return;
    } catch (error) {
      // aborts are handled inside runDownload; reaching here is a real error
      logger.error("download attempt failed", { meetingId, attempt, error });
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    }
  }
  upsertStatus(meetingId, { state: DownloadStatus.FAILED });
}

function allowedMediaMode(
  network: NetworkState,
  isManual: boolean,
): MediaDownloadMode {
  // manual saves ignore the auto-download rules and prefer video
  if (isManual) return MediaDownloadMode.VIDEO;
  const { wifiMode, cellularMode } = useDownloads.getState().settings;
  return network.type === NetworkStateType.CELLULAR ? cellularMode : wifiMode;
}

async function runDownload(entry: DownloadEntry, mode: MediaDownloadMode) {
  const { meetingId } = entry;
  logger.info("downloading meeting", {
    meetingId,
    mode,
    isManual: entry.isManual,
  });

  const result = await fetchMeetingPayload(meetingId);
  if (!result.ok) {
    logger.info("access revoked. deleting download", { meetingId });
    deleteDownload(meetingId);
    return;
  }
  await writePayload(meetingId, result.payload);
  if (!downloadsApi.find(meetingId)) {
    deleteMeetingDir(meetingId);
    return;
  }

  const meeting = result.payload.meeting;
  const media = selectMediaSource(
    mode,
    meeting?.audio_url ?? null,
    meeting?.video_url ?? null,
  );
  if (!media) {
    completeEntry(entry, "json");
    return;
  }
  const { url: mediaUrl, fileType } = media;
  // a video fetched because the meeting has no audio asset must not be
  // aborted by the video-only network rule below
  const isVideoFallback =
    fileType === "video" && mode !== MediaDownloadMode.VIDEO;

  if (!(await hasMinimumDiskSpace())) {
    throw new Error("insufficient disk space");
  }

  const activeDownload: ActiveDownload = { controller: new AbortController() };
  active.set(meetingId, activeDownload);

  // hardening #7: if a network switch stops allowing this file, abort and
  // leave the entry PENDING for the reconciler
  const networkSubscription = entry.isManual
    ? null
    : addNetworkStateListener((state) => {
        const newMode = allowedMediaMode(state, false);
        const disallowed =
          state.isInternetReachable === false ||
          newMode === MediaDownloadMode.OFF ||
          (fileType === "video" &&
            !isVideoFallback &&
            newMode !== MediaDownloadMode.VIDEO);
        if (disallowed) {
          activeDownload.reason = "network-rules";
          activeDownload.controller.abort();
        }
      });

  let budgetChecked = false;
  let lastPersistAt = 0;
  let lastPersistedProgress = 0;

  try {
    await downloadFile(mediaUrl, getMediaUri(meetingId, fileType), {
      signal: activeDownload.controller.signal,
      onProgress: ({ totalBytesWritten, totalBytes }) => {
        if (!budgetChecked) {
          budgetChecked = true;
          if (!entry.isManual) {
            ensureCacheBudget(entry, totalBytes, activeDownload);
          }
        }
        const progress = totalBytes ? totalBytesWritten / totalBytes : 0;
        const now = Date.now();
        if (
          now - lastPersistAt >= PROGRESS_PERSIST_INTERVAL_MS ||
          progress - lastPersistedProgress >= PROGRESS_PERSIST_STEP
        ) {
          lastPersistAt = now;
          lastPersistedProgress = progress;
          upsertStatus(meetingId, {
            state: DownloadStatus.IN_PROGRESS,
            progress,
          });
        }
      },
    });
  } catch (error) {
    handleDownloadAbort(meetingId, fileType, activeDownload.reason, error);
    return;
  } finally {
    networkSubscription?.remove();
    active.delete(meetingId);
  }

  completeEntry(entry, fileType);
}

function completeEntry(
  entry: DownloadEntry,
  fileType: "video" | "audio" | "json",
) {
  upsertStatus(entry.meetingId, {
    state: DownloadStatus.COMPLETE,
    downloadedAt: Date.now(),
    sizeBytes: dirSizeBytes(entry.meetingId),
    fileType,
  });
  logger.info("download complete", { meetingId: entry.meetingId, fileType });
}

function handleDownloadAbort(
  meetingId: string,
  fileType: "video" | "audio",
  reason: AbortReason | undefined,
  error: unknown,
) {
  switch (reason) {
    case "user-cancel":
      // cancelDownload already removed the entry; just make sure no files remain
      deleteMeetingDir(meetingId);
      return;
    case "network-rules":
      deleteMediaFile(meetingId, fileType);
      upsertStatus(meetingId, { state: DownloadStatus.PENDING });
      return;
    case "cache-cap":
      // nothing older to evict: park this meeting and every older auto task
      capExhausted = true;
      deleteMeetingDir(meetingId);
      upsertStatus(meetingId, { state: DownloadStatus.PENDING });
      return;
    default:
      // real transfer error — clean the partial and rethrow so the retry
      // loop in processDownload takes over
      deleteMediaFile(meetingId, fileType);
      throw error;
  }
}

// Ensures that the cache has enough space for the new download.
function ensureCacheBudget(
  entry: DownloadEntry,
  totalBytes: number | null,
  activeDownload: ActiveDownload,
) {
  const { settings, index } = useDownloads.getState();
  if (totalBytes === null) return;

  const now = Date.now();
  const { evictions, fits } = selectBudgetEvictionMeetingIds({
    index,
    maxCacheBytes: settings.maxCacheBytes,
    incomingBytes: totalBytes,
    incomingDateMs: entryDateMs(entry, now),
    now,
  });
  for (const meetingId of evictions) {
    logger.info("cache budget: evicting older cached meeting", { meetingId });
    deleteDownload(meetingId);
  }
  if (!fits) {
    activeDownload.reason = "cache-cap";
    activeDownload.controller.abort();
  }
}

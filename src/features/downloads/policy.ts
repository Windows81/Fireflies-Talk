import { PROCESS_MEETING_STATUS } from "@/constants/meeting";
import { DEMO_MEETING_IDS } from "@/features/meeting/constants/demo";
import type {
  CoreFeedMeetingFieldsFragment,
  FetchChannelMeetingsQuery,
} from "@/graphql";
import type { DownloadEntry, SourceSnapshot } from "./types";
import { DownloadStatus, MediaDownloadMode } from "./types";

type MineSource = NonNullable<
  FetchChannelMeetingsQuery["getChannelMeetings"]
>["meetings"][number];

export interface AutoDownloadCandidate {
  meetingId: string;
  target: "notebook" | "feed";
  snapshot: SourceSnapshot;
}
/**
 * Auto-download cache policy.
 *
 * Downloads fall into two buckets:
 * - **Auto cache** — background downloads of recent meetings. Subject to a
 *   byte cap (`maxCacheBytes`), retention expiry, and eviction rules below.
 * - **Manual saves** — user-initiated downloads. Never capped, never evicted,
 *   never expired by these functions.
 *
 * Three mechanisms remove auto-cache entries (manual saves are always skipped):
 * 1. **Retention** — delete auto-cached meetings (autos) not seen in a recent scan for 30 days.
 * 2. **Cap eviction** — after retention, delete oldest autos until total size
 *    is under the cap (runs in periodic cleanup).
 * 3. **Budget eviction** — before a new download starts, delete older autos to
 *    make room; abort the download if it still won't fit (runs in the queue).
 */

/** How many recent notebook meetings to consider on each auto-download scan. */
export const NOTEBOOK_SCAN_SIZE = 20;
/** How many recent feed meetings to consider on each auto-download scan. */
export const FEED_SCAN_SIZE = 20;

/**
 * Auto downloads are deleted when they have not appeared in a scan for this
 * many days. The clock resets via `lastSeenAt` whenever the meeting is still
 * among the user's recents.
 */
export const AUTO_DOWNLOAD_RETENTION_DAYS = 30;
const RETENTION_MS = AUTO_DOWNLOAD_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Only meetings whose date falls within this window are eligible for
 * auto-download. Older meetings are ignored even if they appear in the scan.
 */
export const AUTO_DOWNLOAD_INTAKE_DAYS = 90;
const INTAKE_MS = AUTO_DOWNLOAD_INTAKE_DAYS * 24 * 60 * 60 * 1000;

const dateMs = (value: string | null | undefined): number => {
  const parsed = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Timestamp used to rank meetings from oldest to newest during cap/budget
 * eviction.
 *
 * Prefers the meeting's own date. When that is missing, completed downloads
 * fall back to `downloadedAt`. Pending downloads use `now` so they are treated
 * as newest and never evicted just because their age is unknown.
 */
export const entryDateMs = (entry: DownloadEntry, now: number): number => {
  const parsed = dateMs(entry.snapshot.date ?? entry.snapshot.startTime);
  if (parsed > 0) return parsed;
  return entry.status.state === DownloadStatus.COMPLETE
    ? entry.status.downloadedAt
    : now;
};

/**
 * Retention sweep — returns meeting IDs of auto downloads that should be
 * deleted because they have gone stale.
 *
 * An auto download is stale when it is complete and the time since its last
 * scan touch (`lastSeenAt`, or `downloadedAt` if never seen) exceeds
 * {@link AUTO_DOWNLOAD_RETENTION_DAYS}.
 *
 * Called by `runDownloadsCleanup` while online. Manual saves and
 * non-complete entries are never returned.
 */
export function selectExpiredMeetingIds(
  index: DownloadEntry[],
  now: number,
): string[] {
  return index
    .filter(
      (e) =>
        !e.isManual &&
        e.status.state === DownloadStatus.COMPLETE &&
        now - (e.lastSeenAt ?? e.status.downloadedAt) > RETENTION_MS,
    )
    .map((e) => e.meetingId);
}

/**
 * Cap sweep — returns meeting IDs of auto downloads to delete because the
 * total cached size exceeds `maxCacheBytes`.
 *
 * Evicts complete auto downloads starting with the oldest meeting date until
 * the remaining cache fits the cap. Manual saves do not count toward the
 * total and are never evicted.
 *
 * Called by `runDownloadsCleanup` after the retention sweep.
 */
export function selectCapEvictionMeetingIds(
  index: DownloadEntry[],
  maxCacheBytes: number,
  now: number,
): string[] {
  const cached: { meetingId: string; dateMs: number; sizeBytes: number }[] = [];
  for (const e of index) {
    if (e.isManual || e.status.state !== DownloadStatus.COMPLETE) continue;
    cached.push({
      meetingId: e.meetingId,
      dateMs: entryDateMs(e, now),
      sizeBytes: e.status.sizeBytes,
    });
  }

  let total = cached.reduce((sum, e) => sum + e.sizeBytes, 0);
  const evictions: string[] = [];
  for (const e of cached.sort((a, b) => a.dateMs - b.dateMs)) {
    if (total <= maxCacheBytes) break;
    evictions.push(e.meetingId);
    total -= e.sizeBytes;
  }
  return evictions;
}

/**
 * Pre-download budget check — decides which existing auto downloads to remove
 * so a new download can start, and whether there is enough room even after
 * evicting them.
 *
 * Only evicts complete auto downloads whose meeting date is **strictly older**
 * than the incoming meeting, oldest first. Newer cached meetings are never
 * removed to make room for an older one.
 *
 * Returns:
 * - `evictions` — meeting IDs to delete before starting the download.
 * - `fits` — `false` when the incoming file is still too large after all
 *   eligible evictions; the queue aborts and leaves the entry as PENDING.
 *
 * Called by `ensureCacheBudget` in the download queue.
 */
export function selectBudgetEvictionMeetingIds(input: {
  index: DownloadEntry[];
  maxCacheBytes: number;
  incomingBytes: number;
  incomingDateMs: number;
  now: number;
}): { evictions: string[]; fits: boolean } {
  const { index, maxCacheBytes, incomingBytes, incomingDateMs, now } = input;

  const cached: { meetingId: string; dateMs: number; sizeBytes: number }[] = [];
  for (const e of index) {
    if (e.isManual || e.status.state !== DownloadStatus.COMPLETE) continue;
    cached.push({
      meetingId: e.meetingId,
      dateMs: entryDateMs(e, now),
      sizeBytes: e.status.sizeBytes,
    });
  }

  let projected =
    cached.reduce((sum, e) => sum + e.sizeBytes, 0) + incomingBytes;
  const evictions: string[] = [];
  for (const e of cached.sort((a, b) => a.dateMs - b.dateMs)) {
    if (projected <= maxCacheBytes) break;
    if (e.dateMs >= incomingDateMs) break;
    evictions.push(e.meetingId);
    projected -= e.sizeBytes;
  }
  return { evictions, fits: projected <= maxCacheBytes };
}

/**
 * Picks which media file a download should fetch. VIDEO mode prefers video,
 * AUDIO mode prefers audio; either falls back to the other asset so a meeting
 * with a single media file (e.g. a video upload with no audio_url) still gets
 * a playable download. Null when the meeting has no media at all.
 */
export function selectMediaSource(
  mode: MediaDownloadMode,
  audioUrl: string | null,
  videoUrl: string | null,
): { url: string; fileType: "video" | "audio" } | null {
  const preferVideo =
    mode === MediaDownloadMode.VIDEO ? videoUrl !== null : audioUrl === null;
  const url = preferVideo ? videoUrl : audioUrl;
  if (!url) return null;
  return { url, fileType: preferVideo ? "video" : "audio" };
}

/** Notebook meeting is ready to auto-download when processing finished and captions exist. */
export const isEligibleSource = (source: MineSource): boolean =>
  source.processMeetingStatus === PROCESS_MEETING_STATUS.COMPLETED &&
  source.hasCaptions === true;

/** Builds a persisted snapshot from a feed meeting (no signed `audio_url`). */
export function snapshotFromFeedMeeting(
  meeting: CoreFeedMeetingFieldsFragment,
): SourceSnapshot {
  return {
    id: meeting._id,
    parseId: meeting._id,
    title: meeting.title,
    date: meeting.startTime ?? null,
    startTime: meeting.startTime ?? null,
    creator_email: meeting.organizerEmail,
    owner: meeting.owner ?? null,
    addedBy: meeting.addedBy ?? null,
  };
}

/**
 * Auto-download scan — picks new meetings to download from the latest notebook
 * and feed results.
 *
 * Filters to eligible, in-window meetings (see {@link AUTO_DOWNLOAD_INTAKE_DAYS}),
 * skips demo meetings, and deduplicates notebook vs feed (notebook wins).
 * Meetings already in the download index — pending, in progress, or complete —
 * are excluded from `candidates` but still appear in `seenMeetingIds`.
 *
 * Returns:
 * - `candidates` — new auto downloads to enqueue, ordered newest meeting first.
 * - `seenMeetingIds` — every eligible meeting from this scan; the caller
 *   refreshes `lastSeenAt` on these so retention does not expire active recents.
 *
 * Called on each auto-download reconciler cycle when the feature is enabled.
 */
export function selectAutoCandidates(input: {
  mineSources: MineSource[];
  feedMeetings: CoreFeedMeetingFieldsFragment[];
  index: DownloadEntry[];
  now: number;
}): { candidates: AutoDownloadCandidate[]; seenMeetingIds: string[] } {
  const { mineSources, feedMeetings, index, now } = input;
  const known = new Set(index.map((e) => e.meetingId));
  const cutoff = now - INTAKE_MS;
  const candidates = new Map<string, AutoDownloadCandidate>();

  for (const source of mineSources.slice(0, NOTEBOOK_SCAN_SIZE)) {
    const meetingId = source.parseId;
    if (!meetingId || !isEligibleSource(source)) continue;
    if (DEMO_MEETING_IDS.includes(meetingId)) continue;
    if (dateMs(source.date) < cutoff) continue;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { audio_url: _audioUrl, ...snapshot } = source;
    candidates.set(meetingId, { meetingId, target: "notebook", snapshot });
  }

  for (const meeting of feedMeetings.slice(0, FEED_SCAN_SIZE)) {
    const meetingId = meeting._id;
    if (candidates.has(meetingId)) continue;
    if (DEMO_MEETING_IDS.includes(meetingId)) continue;
    if (meeting.summary.length === 0) continue;
    if (dateMs(meeting.startTime) < cutoff) continue;
    candidates.set(meetingId, {
      meetingId,
      target: "feed",
      snapshot: snapshotFromFeedMeeting(meeting),
    });
  }

  return {
    candidates: [...candidates.values()]
      .filter((c) => !known.has(c.meetingId))
      .sort(
        (a, b) =>
          dateMs(b.snapshot.date ?? b.snapshot.startTime) -
          dateMs(a.snapshot.date ?? a.snapshot.startTime),
      ),
    seenMeetingIds: [...candidates.keys()],
  };
}

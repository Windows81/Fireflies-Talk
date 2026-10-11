import { useAuth } from "@/features/auth";
import type {
  FetchChannelMeetingsQuery,
  GetFeedMeetingsQuery,
} from "@/graphql";
import {
  apolloClient,
  FetchChannelMeetingsDocument,
  GetFeedMeetingsDocument,
} from "@/graphql";
import { Logger } from "@/logger";
import { useNetworkState } from "@/utils/network";
import { useEffect } from "react";
import { Platform } from "react-native";
import { runDownloadsCleanup } from "./cleanup";
import { writeFeedSnapshot } from "./feed-snapshot";
import { refreshDownloadedPayloads } from "./payload";
import { NOTEBOOK_SCAN_SIZE, selectAutoCandidates } from "./policy";
import { enqueueDownload } from "./queue";
import { downloadsApi, useDownloads } from "./store";
import { DownloadStatus } from "./types";
import { isDesktop } from "@/utils/device";

const logger = new Logger("auto-download");
const SYNC_TIMEOUT_MS = 5000;

const SILENT_NETWORK_ONLY = {
  fetchPolicy: "network-only" as const,
  context: { silentErrors: true },
};

/**
 * Downloads reconciler, mirroring useAutoUploadRecords: when online, every
 * stored payload is refreshed — which deletes revoked downloads, manual saves
 * included, regardless of the master toggle. With the toggle ON it also
 * recovers interrupted downloads and scans the notebook + feed for fresh auto
 * candidates. Cleanup sweeps always run, after the scan. Network TYPE is a
 * dependency so pending entries resume when the rules allow them again
 * (e.g. back on Wi-Fi).
 */
export const useAutoDownloadRecent = () => {
  const { user } = useAuth();
  const autoDownloadEnabled = useDownloads(
    (s) => s.settings.autoDownloadEnabled,
  );
  const networkState = useNetworkState();

  useEffect(() => {
    if (Platform.OS === "web" || isDesktop) return;
    if (!user) return;

    const online = networkState.isInternetReachable === true;
    const timeoutId = setTimeout(async () => {
      try {
        if (online) {
          await refreshDownloadedPayloads();
          if (autoDownloadEnabled) {
            recoverInterruptedDownloads(user.id);
            await scanForAutoCandidates();
          }
        }
        runDownloadsCleanup({ online });
      } catch (error) {
        logger.error("reconciler cycle failed", { error });
      }
    }, SYNC_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [
    user,
    autoDownloadEnabled,
    networkState.isInternetReachable,
    networkState.type,
  ]);
};

/**
 * Force-kill recovery: PENDING, IN_PROGRESS and FAILED entries all re-enter
 * the queue through the same path, manual and auto alike. Only the current
 * user's entries — another account's downloads can't be fetched with this
 * session's permissions.
 */
function recoverInterruptedDownloads(userId: string) {
  for (const entry of useDownloads.getState().index) {
    if (entry.userId !== userId) continue;
    if (entry.status.state === DownloadStatus.COMPLETE) continue;
    enqueueDownload({
      meetingId: entry.meetingId,
      isManual: entry.isManual,
      target: entry.target,
      snapshot: entry.snapshot,
    });
  }
}

/**
 * Scan the notebook and feed for auto-download candidates
 * This is used to find meetings that can be downloaded automatically
 * based on the user's settings and the meeting's metadata
 */
async function scanForAutoCandidates() {
  const [mineResult, feedResult] = await Promise.all([
    apolloClient
      .query<FetchChannelMeetingsQuery>({
        query: FetchChannelMeetingsDocument,
        variables: { channelId: "mine", from: 0, size: NOTEBOOK_SCAN_SIZE },
        ...SILENT_NETWORK_ONLY,
      })
      .catch(() => null),
    apolloClient
      .query<GetFeedMeetingsQuery>({
        query: GetFeedMeetingsDocument,
        variables: { limit: NOTEBOOK_SCAN_SIZE },
        ...SILENT_NETWORK_ONLY,
      })
      .catch(() => null),
  ]);

  const mineSources = mineResult?.data?.getChannelMeetings?.meetings ?? [];
  const feedMeetings = feedResult?.data?.getFeedMeetings?.meetings ?? [];

  // the same first feed page doubles as the offline Home snapshot — only a
  // successful query overwrites it (a failed one must not blank the file)
  if (feedResult?.data?.getFeedMeetings?.meetings) {
    await writeFeedSnapshot(feedResult.data.getFeedMeetings.meetings).catch(
      (error) => logger.warn("feed snapshot write failed", { error }),
    );
  }

  if (mineSources.length === 0 && feedMeetings.length === 0) return;

  const { candidates, seenMeetingIds } = selectAutoCandidates({
    mineSources,
    feedMeetings,
    index: useDownloads.getState().index,
    now: Date.now(),
  });
  // keep still-recent cached meetings alive: their retention clock only
  // starts once they stop appearing in the scan
  downloadsApi.markSeen(seenMeetingIds, Date.now());
  if (candidates.length > 0) {
    logger.info("scan found auto-download candidates", {
      count: candidates.length,
    });
  }
  for (const candidate of candidates) {
    enqueueDownload({ ...candidate, isManual: false });
  }
}

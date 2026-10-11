import { Logger } from "@/logger";
import { Directory } from "expo-file-system";
import { deleteFeedSnapshot } from "./feed-snapshot";
import { deleteMeetingDir, DOWNLOADS_DIRECTORY } from "./fs";
import { selectCapEvictionMeetingIds, selectExpiredMeetingIds } from "./policy";
import { downloadsApi, useDownloads } from "./store";

const logger = new Logger("download-cleanup");

// Removes a download completely: files on disk + index entry.
// Shared by the Downloads screen, the meeting menu, revocation and sweeps.
export function deleteDownload(meetingId: string) {
  deleteMeetingDir(meetingId);
  downloadsApi.remove(meetingId);
}

// Master switch OFF: the entire auto cache is wiped; saved downloads are kept.
export function wipeAutoCache() {
  const downloads = useDownloads.getState();
  for (const entry of downloads.index) {
    if (!entry.isManual) deleteDownload(entry.meetingId);
  }
  deleteFeedSnapshot();
}

/**
 * Deletes expired downloads based on the retention policy and evicts cached
 * downloads when the cache is full.
 */
export function runDownloadsCleanup(options: { online: boolean }) {
  const now = Date.now();

  if (options.online) {
    const { index } = useDownloads.getState();
    for (const meetingId of selectExpiredMeetingIds(index, now)) {
      logger.info("retention sweep: deleting expired download", { meetingId });
      deleteDownload(meetingId);
    }
  }

  const { index, settings } = useDownloads.getState();
  const evictions = selectCapEvictionMeetingIds(
    index,
    settings.maxCacheBytes,
    now,
  );
  for (const meetingId of evictions) {
    logger.info("cap eviction: deleting cached download", { meetingId });
    deleteDownload(meetingId);
  }

  cleanOrphanDirectories();
}

// Dirs on disk with no index entry at all (leftovers from a crash between
// entry removal and dir deletion). Files like feed.json are left alone.
function cleanOrphanDirectories() {
  try {
    const root = new Directory(DOWNLOADS_DIRECTORY);
    if (!root.exists) return;
    const known = new Set(
      useDownloads.getState().index.map((e) => e.meetingId),
    );
    for (const item of root.list()) {
      const isDirectory = item instanceof Directory;
      const isKnown = isDirectory && known.has(item.name);

      // Only process items that are directories and not in the known set
      if (isDirectory && !isKnown) {
        logger.info("orphan sweep: deleting untracked dir", {
          name: item.name,
        });
        item.delete();
      }
    }
  } catch (error) {
    logger.warn("orphan sweep failed", { error });
  }
}

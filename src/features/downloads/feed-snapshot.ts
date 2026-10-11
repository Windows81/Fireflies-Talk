import { useAuth } from "@/features/auth";
import type { CoreFeedMeetingFieldsFragment } from "@/graphql";
import * as NativeCode from "@/modules/native-code";
import { createDirectoryIfNotExist } from "@/utils/file";
import { File } from "expo-file-system";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { DOWNLOADS_DIRECTORY } from "./fs";
import { useDownloads } from "./store";
import { DownloadStatus } from "./types";

// First Home-feed page, persisted so Home renders "as if connected" offline.
// Survives logout; owner-stamped so another account on the same device never
// sees it. Overwritten by the first online reconciler cycle.
const FEED_SNAPSHOT_URI = `${DOWNLOADS_DIRECTORY}feed.json`;

interface FeedSnapshot {
  userId: string;
  meetings: CoreFeedMeetingFieldsFragment[];
}

export async function writeFeedSnapshot(
  meetings: CoreFeedMeetingFieldsFragment[],
) {
  const userId = useAuth.getState().user?.id;
  if (!userId) return;
  await createDirectoryIfNotExist(DOWNLOADS_DIRECTORY);
  // Re-downloadable content must be excluded from iCloud backup per Apple's guidelines
  NativeCode.setExcludedFromBackup(DOWNLOADS_DIRECTORY);
  const snapshot: FeedSnapshot = { userId, meetings };
  new File(FEED_SNAPSHOT_URI).write(JSON.stringify(snapshot));
}

export async function readFeedSnapshot(): Promise<FeedSnapshot | null> {
  try {
    const parsed = JSON.parse(await new File(FEED_SNAPSHOT_URI).text());
    // pre-userId snapshots were a bare array — treat as absent
    if (typeof parsed?.userId !== "string" || !Array.isArray(parsed.meetings)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function deleteFeedSnapshot() {
  const file = new File(FEED_SNAPSHOT_URI);
  if (file.exists) file.delete();
}

/**
 * Offline read path for the Home feed: loads the persisted snapshot when
 * `enabled` (the query failed offline). Web/desktop → null, and so is a
 * snapshot left behind by a different account.
 *
 * Only meetings the current user has a COMPLETE download for are returned —
 * a snapshot row without its local payload/media would be a dead tap offline.
 */
export function useOfflineFeedSnapshot(
  enabled: boolean,
): CoreFeedMeetingFieldsFragment[] | null {
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(null);
  const index = useDownloads((s) => s.index);
  const userId = useAuth((s) => s.user?.id);

  useEffect(() => {
    if (!enabled || Platform.OS === "web") return;
    let cancelled = false;
    void readFeedSnapshot().then((result) => {
      if (!cancelled) setSnapshot(result);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return useMemo(() => {
    if (!snapshot || !userId || snapshot.userId !== userId) return null;
    const downloaded = new Set(
      index
        .filter(
          (e) =>
            e.userId === userId && e.status.state === DownloadStatus.COMPLETE,
        )
        .map((e) => e.meetingId),
    );
    return snapshot.meetings.filter((meeting) => downloaded.has(meeting._id));
  }, [snapshot, index, userId]);
}

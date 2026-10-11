import { useAuth } from "@/features/auth";
import { useDownloads } from "./store";

/**
 * The current user's download entry for a meeting. A copy another account left
 * on this device is invisible — its files are unreadable to this session, so
 * surfacing it would show "Saved offline" for something that cannot be played.
 *
 * This hook is a safeguard that prevents user A being able to see saved content
 * from user B in offline mode.
 */
export function useOwnedDownload(meetingId: string) {
  const userId = useAuth((s) => s.user?.id);
  return useDownloads((s) =>
    s.index.find((e) => e.meetingId === meetingId && e.userId === userId),
  );
}

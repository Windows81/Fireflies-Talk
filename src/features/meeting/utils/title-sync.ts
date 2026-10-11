// Desktop runs each window (home, live, notepad popouts) as its own renderer
// with its own Apollo cache and zustand stores, so a rename applied in one
// window is invisible to the others until a server refetch — and surfaces fed
// by the recorder context (home banner, LocalMeetingItem) never pick it up at
// all. Every rename goes through here so it is applied locally and mirrored to
// the other windows over IPC.
import { liveMeetingsApi } from "@/features/live";
import { isDesktop } from "@/utils/device";
import type { MeetingTitleUpdate } from "electron/src/types";
import {
  revertMeetingTitleCache,
  revertOptimisticMeetingTitle,
  updateMeetingTitleCache,
} from "./title-cache";

const broadcast = (update: MeetingTitleUpdate): void => {
  if (!isDesktop) return;
  window.electron?.meeting?.broadcastTitleUpdate?.(update);
};

// The title lives in two places per window: the live-meetings overlay (home
// banners) and the Apollo cache (live header, notepad, lists).
const applyTitleLocally = (meetingId: string, title: string): void => {
  liveMeetingsApi.updateTitle(meetingId, title);
  updateMeetingTitleCache(meetingId, title);
};

/** Apply an optimistic rename in this window and mirror it to the others. */
export function applyMeetingTitleRename(
  meetingId: string,
  title: string,
): void {
  applyTitleLocally(meetingId, title);
  broadcast({ meetingId, title });
}

/**
 * The rename failed to persist: roll it back here (with the failure toast) and
 * in the other windows, so no window is left showing a title that was never
 * saved. Local component state is reverted by the caller.
 */
export function revertMeetingTitleRename(
  meetingId: string,
  attemptedTitle: string,
  previousTitle: string,
  error: { message: string },
): void {
  revertOptimisticMeetingTitle(meetingId, attemptedTitle, previousTitle, error);
  broadcast({ meetingId, title: previousTitle, revertedFrom: attemptedTitle });
}

/**
 * Listen for renames broadcast by any window (this one included — the recorder
 * store rides the same event to update the title it holds for an in-progress
 * recording). Applies locally only; re-broadcasting here would loop. Re-applying
 * the sender's own update is a no-op: both writes are idempotent and the revert
 * is guarded on the title that failed.
 */
export function initMeetingTitleSync(): () => void {
  if (!isDesktop || !window.electron?.meeting) return () => {};

  return window.electron.meeting.onTitleUpdated((update) => {
    if (!update?.meetingId) return;

    if (update.revertedFrom !== undefined) {
      revertMeetingTitleCache(
        update.meetingId,
        update.revertedFrom,
        update.title,
      );
      return;
    }

    applyTitleLocally(update.meetingId, update.title);
  });
}

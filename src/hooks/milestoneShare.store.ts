import { TRACKING_EVENTS, tracker } from "@/tracking";
import { create } from "zustand";

/** Which surface offered the card, so the two entry points can be told apart. */
export type MilestoneShareSource = "pill_nudge" | "stats_card";

interface MilestoneShare {
  /** Who earned it: signing into another account must not show them this. */
  userId: string;
  /** The rung's own word count, which identifies it — see findMilestone. */
  milestoneWords: number;
  /** The total the card should show, which for a fresh unlock is the total it
   * was earned at rather than whatever has been said since. */
  totalWords: number;
  source: MilestoneShareSource;
}

interface MilestoneShareStore {
  shown?: MilestoneShare;
  show: (shared: MilestoneShare) => void;
  hide: () => void;
}

/**
 * Which milestone card is open, if any. Held outside the screens because the
 * pill's nudge opens it too, and the pill outlives whatever screen — or tab —
 * the user happens to be on.
 */
export const useMilestoneShare = create<MilestoneShareStore>((set) => ({
  show: (shared) => set({ shown: shared }),
  hide: () => set({ shown: undefined }),
}));

/**
 * Tracked here rather than at the call sites: this is the one way the card
 * opens, so a surface added later cannot forget to report it.
 */
export const showMilestoneShare = (shared: MilestoneShare) => {
  tracker.track(TRACKING_EVENTS.DESKTOP_TALK_MILESTONE_SHARE_OPENED, {
    milestoneWords: shared.milestoneWords,
    totalWords: shared.totalWords,
    source: shared.source,
  });
  useMilestoneShare.getState().show(shared);
};

/**
 * Signing out or into another account puts the card away for good. Filtering
 * it by owner hides it, but leaves it to spring back the moment the first
 * account signs in again, which nobody asked it to do.
 */
export const forgetMilestoneShare = () => useMilestoneShare.getState().hide();

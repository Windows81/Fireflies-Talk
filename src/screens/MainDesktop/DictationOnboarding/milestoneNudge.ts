import type { PendingMilestone } from "@/hooks/dictationHistory";
import { findMilestone } from "@/hooks/dictationStats";
import type { DictationTeaserContent } from "electron/src/types";
import type { TalkPillPresence } from "./talkPillTeaser";

export interface MilestoneNudgeInput {
  presence: TalkPillPresence;
  pending: PendingMilestone | undefined;
  userId: string | undefined;
}

/**
 * What the card beside the pill should say, if anything. The introduction wins
 * whenever it is due — someone still being shown what Talk is has no milestones
 * to celebrate — so the nudge only speaks to a pill that is already the user's.
 */
export function resolveTeaserContent(
  input: MilestoneNudgeInput,
): DictationTeaserContent | null {
  const { presence, pending, userId } = input;
  if (presence === "teaser") return { variant: "intro" };
  if (presence !== "interactive") return null;
  if (!pending || !userId || pending.userId !== userId) return null;

  // A rung the ladder no longer has cannot be named on the card or opened from
  // it, so there is nothing to offer. The stats screen drops the stored rung.
  const milestone = findMilestone(pending.milestoneWords);
  if (!milestone) return null;

  return { variant: "milestone", milestone: milestone.name };
}

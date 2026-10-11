import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { DictationTeaserAction } from "electron/src/types";

const TEASER_ACTION_EVENTS: Record<DictationTeaserAction, TRACKING_EVENTS> = {
  close: TRACKING_EVENTS.DESKTOP_TALK_TEASER_CLOSED,
  try: TRACKING_EVENTS.DESKTOP_TALK_TEASER_TRY_CLICKED,
};

export function talkTeaserActionEvent(
  action: DictationTeaserAction,
): TRACKING_EVENTS {
  return TEASER_ACTION_EVENTS[action];
}

export function trackTalkTeaserShown(): void {
  tracker.track(TRACKING_EVENTS.DESKTOP_TALK_TEASER_SHOWN);
}

export function trackTalkTeaserAction(action: DictationTeaserAction): void {
  tracker.track(talkTeaserActionEvent(action));
}

const MILESTONE_ACTION_EVENTS: Record<DictationTeaserAction, TRACKING_EVENTS> =
  {
    close: TRACKING_EVENTS.DESKTOP_TALK_MILESTONE_NUDGE_CLOSED,
    try: TRACKING_EVENTS.DESKTOP_TALK_MILESTONE_NUDGE_SHARE_CLICKED,
  };

/**
 * The milestone nudge is its own funnel: it is shown for a different reason
 * than the introduction, and its button shares rather than starts onboarding.
 * The rung identifies the card, by the word count that names it everywhere.
 */
export function trackMilestoneNudgeShown(milestoneWords: number): void {
  tracker.track(TRACKING_EVENTS.DESKTOP_TALK_MILESTONE_NUDGE_SHOWN, {
    milestoneWords,
  });
}

export function trackMilestoneNudgeAction(
  action: DictationTeaserAction,
  milestoneWords: number,
): void {
  tracker.track(MILESTONE_ACTION_EVENTS[action], { milestoneWords });
}

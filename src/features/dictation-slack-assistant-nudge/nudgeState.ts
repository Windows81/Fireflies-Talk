import {
  isNudgeOwed,
  isNudgeSpent,
  type NudgeShows,
} from "@/features/dictation-assistant-nudge/schedule";
import { countsTowardNudge } from "@/features/dictation-feedback-nudge/nudgeState";
import type { DictationEntry } from "@/hooks/dictationHistoryEntries";
import { SLACK_ASSISTANT_PASTE_TARGET } from "./constants";

export interface UserSlackAssistantNudge extends NudgeShows {
  /** Lifetime successful Talk pastes into Slack — never resets. */
  slackDictations: number;
}

export const EMPTY_SLACK_ASSISTANT_NUDGE: UserSlackAssistantNudge = {
  slackDictations: 0,
  timesSeen: 0,
  lastTimeSeen: null,
};

export type SlackDictationEntry = Pick<
  DictationEntry,
  "kind" | "pasted" | "pastedApp"
>;

export const countsTowardSlackAssistantNudge = (
  entry: SlackDictationEntry,
): boolean =>
  entry.pasted === true &&
  countsTowardNudge(entry.kind) &&
  entry.pastedApp === SLACK_ASSISTANT_PASTE_TARGET;

/**
 * Whether an offer is owed right now: each show spends one milestone, so the
 * next one is the milestone at `timesSeen`. A milestone reached inside the
 * cooldown is not lost — the first Slack paste after it owes the offer.
 */
export function isOwedInState(
  prev: UserSlackAssistantNudge,
  now = Date.now(),
): boolean {
  return isNudgeOwed(prev.slackDictations, prev, now);
}

/**
 * The state after one more dictation, or null when nothing changes — every
 * offer was made or this entry does not count.
 */
export function recordSlackDictationInState(
  prev: UserSlackAssistantNudge,
  entry: SlackDictationEntry,
): UserSlackAssistantNudge | null {
  if (isNudgeSpent(prev)) return null;
  if (!countsTowardSlackAssistantNudge(entry)) return null;

  return {
    ...prev,
    slackDictations: prev.slackDictations + 1,
  };
}

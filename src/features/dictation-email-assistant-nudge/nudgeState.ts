import {
  isNudgeOwed,
  isNudgeSpent,
  type NudgeShows,
} from "@/features/dictation-assistant-nudge/schedule";
import { countsTowardNudge } from "@/features/dictation-feedback-nudge/nudgeState";
import type { DictationEntry } from "@/hooks/dictationHistoryEntries";
import { isEmailApp } from "./emailApps";

export interface UserEmailAssistantNudge extends NudgeShows {
  /** Lifetime successful Talk pastes into an email client — never resets. */
  emailDictations: number;
  lastEmailApp?: string;
}

export const EMPTY_EMAIL_ASSISTANT_NUDGE: UserEmailAssistantNudge = {
  emailDictations: 0,
  timesSeen: 0,
  lastTimeSeen: null,
};

export type EmailDictationEntry = Pick<
  DictationEntry,
  "kind" | "pasted" | "pastedApp"
>;

export const countsTowardEmailAssistantNudge = (
  entry: EmailDictationEntry,
): boolean =>
  entry.pasted === true &&
  countsTowardNudge(entry.kind) &&
  isEmailApp(entry.pastedApp);

/**
 * Whether an offer is owed right now: each show spends one milestone, so the
 * next one is the milestone at `timesSeen`. A milestone reached inside the
 * cooldown is not lost — the first email paste after it owes the offer.
 */
export function isOwedInState(
  prev: UserEmailAssistantNudge,
  now = Date.now(),
): boolean {
  return isNudgeOwed(prev.emailDictations, prev, now);
}

/**
 * The state after one more dictation, or null when nothing changes — every
 * offer was made or this entry does not count.
 */
export function recordEmailDictationInState(
  prev: UserEmailAssistantNudge,
  entry: EmailDictationEntry,
): UserEmailAssistantNudge | null {
  if (isNudgeSpent(prev)) return null;
  if (!countsTowardEmailAssistantNudge(entry)) return null;

  return {
    ...prev,
    emailDictations: prev.emailDictations + 1,
    lastEmailApp: entry.pastedApp,
  };
}

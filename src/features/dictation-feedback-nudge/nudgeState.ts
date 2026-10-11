import type { DictationEntry } from "@/hooks/dictationHistoryEntries";
import {
  TALK_FEEDBACK_NUDGE_COOLDOWN_MS,
  TALK_FEEDBACK_NUDGE_MILESTONES,
  TALK_FEEDBACK_NUDGE_SKIP_WINDOW,
} from "./constants";

export interface UserNudgeState {
  /** Lifetime spoken dictations for this user — never resets. */
  completedDictations: number;
  /** Offers actually put on screen. */
  timesShown: number;
  /**
   * The offer is owed but has not been made yet. Persisted, so quitting inside
   * the delay resumes the offer on the next launch rather than losing it.
   */
  nudgePending: boolean;
  /**
   * Settled forever: the user submitted feedback, or every offer was made.
   * No milestone can ever owe an offer again.
   */
  completed: boolean;
  /** Dictation count at which the next offer is owed; null once none is left. */
  nextMilestone: number | null;
  /** Dictation count of the offer most recently shown, if any. */
  lastShownMilestone: number | null;
  /** Epoch ms of the last show, for the cooldown. */
  lastShownAt: number | null;
}

export const EMPTY_NUDGE_STATE: UserNudgeState = {
  completedDictations: 0,
  timesShown: 0,
  nudgePending: false,
  completed: false,
  nextMilestone: TALK_FEEDBACK_NUDGE_MILESTONES[0],
  lastShownMilestone: null,
  lastShownAt: null,
};

/**
 * "Polish" rewrites text the user selected — nothing was spoken — so it is not
 * a dictation for the purpose of the count. Entries written before `kind`
 * existed are treated as dictation.
 */
export const countsTowardNudge = (kind?: DictationEntry["kind"]): boolean =>
  kind !== "polish";

/**
 * The first milestone far enough past `count` that showing it would not land
 * back to back with the previous offer; null when the schedule is done.
 */
export const nextMilestoneAfter = (count: number): number | null =>
  TALK_FEEDBACK_NUDGE_MILESTONES.find(
    (m) => m - count > TALK_FEEDBACK_NUDGE_SKIP_WINDOW,
  ) ?? null;

const inCooldown = (prev: UserNudgeState, now: number): boolean =>
  prev.lastShownAt !== null &&
  now - prev.lastShownAt < TALK_FEEDBACK_NUDGE_COOLDOWN_MS;

/**
 * The state after one more dictation, or null when nothing changes — the
 * nudge is settled, no milestone is left, or this entry does not count. A
 * milestone reached inside the cooldown is not lost: the count stays past
 * nextMilestone, so the first dictation after it pends the offer.
 */
export function recordDictationInState(
  prev: UserNudgeState,
  kind?: DictationEntry["kind"],
  now = Date.now(),
): UserNudgeState | null {
  if (prev.completed || prev.nextMilestone === null || !countsTowardNudge(kind))
    return null;

  const completedDictations = prev.completedDictations + 1;
  return {
    ...prev,
    completedDictations,
    nudgePending:
      prev.nudgePending ||
      (completedDictations >= prev.nextMilestone && !inCooldown(prev, now)),
  };
}

/** The state after the card was shown: the pending offer is spent. */
export function markShownInState(
  prev: UserNudgeState,
  now = Date.now(),
): UserNudgeState {
  const timesShown = prev.timesShown + 1;
  const nextMilestone = nextMilestoneAfter(prev.completedDictations);
  return {
    ...prev,
    timesShown,
    nudgePending: false,
    lastShownMilestone: prev.nextMilestone,
    lastShownAt: now,
    nextMilestone,
    completed:
      prev.completed ||
      nextMilestone === null ||
      timesShown >= TALK_FEEDBACK_NUDGE_MILESTONES.length,
  };
}

/** The state after a submit: no milestone can owe an offer again. */
export function markCompletedInState(prev: UserNudgeState): UserNudgeState {
  return { ...prev, completed: true, nudgePending: false, nextMilestone: null };
}

/**
 * A user with dictation history but no nudge record. No pending offer: the
 * prompt only comes after their next dictation.
 */
export const seedFromHistoryInState = (count: number): UserNudgeState => ({
  ...EMPTY_NUDGE_STATE,
  completedDictations: count,
});

/**
 * v1 persisted a single shown flag per user. A `nudgeShown` entry maps to one
 * milestone spent; anything else carries no information and starts over.
 */
function migrateV1(persistedState: unknown): {
  byUser: Record<string, unknown>;
} {
  const byUser = (persistedState as { byUser?: Record<string, unknown> })
    ?.byUser;
  if (!byUser) return { byUser: {} };
  return {
    byUser: Object.fromEntries(
      Object.entries(byUser).flatMap(([userId, entry]) => {
        const v1 = entry as {
          completedDictations?: number;
          nudgeShown?: boolean;
        };
        if (!v1?.nudgeShown) return [];
        return [
          [
            userId,
            {
              completedDictations: v1.completedDictations ?? 0,
              timesShown: 1,
              nudgePending: false,
              completed: false,
            },
          ],
        ];
      }),
    ),
  };
}

/** Fills the explicit-milestone fields v2 states did not carry. */
function migrateV2(persistedState: unknown): {
  byUser: Record<string, UserNudgeState>;
} {
  const byUser = (persistedState as { byUser?: Record<string, unknown> })
    ?.byUser;
  if (!byUser) return { byUser: {} };
  return {
    byUser: Object.fromEntries(
      Object.entries(byUser).map(([userId, entry]) => {
        const v2 = entry as {
          completedDictations?: number;
          timesShown?: number;
          nudgePending?: boolean;
          completed?: boolean;
        };
        const timesShown = v2.timesShown ?? 0;
        const nextMilestone =
          TALK_FEEDBACK_NUDGE_MILESTONES[timesShown] ?? null;
        return [
          userId,
          {
            completedDictations: v2.completedDictations ?? 0,
            timesShown,
            nudgePending: v2.nudgePending ?? false,
            completed: (v2.completed ?? false) || nextMilestone === null,
            nextMilestone,
            lastShownMilestone:
              timesShown > 0
                ? TALK_FEEDBACK_NUDGE_MILESTONES[timesShown - 1]
                : null,
            lastShownAt: null,
          } satisfies UserNudgeState,
        ];
      }),
    ),
  };
}

/** Maps a persisted store from version `version` to the current shape. */
export function migrateNudgePersistedState(
  persistedState: unknown,
  version: number,
): { byUser: Record<string, UserNudgeState> } {
  const state = version <= 1 ? migrateV1(persistedState) : persistedState;
  return migrateV2(state);
}

/**
 * Folds the server-side show count in: another device's shows advance this
 * device's milestone schedule. A pending offer is dropped if this device's
 * dictation count has not reached the adopted next milestone.
 */
export function adoptServerTimesShown(
  prev: UserNudgeState,
  serverTimesSeen: number,
): UserNudgeState {
  const timesShown = Math.max(prev.timesShown, serverTimesSeen);
  if (timesShown >= TALK_FEEDBACK_NUDGE_MILESTONES.length)
    return {
      ...prev,
      timesShown,
      nudgePending: false,
      completed: true,
      nextMilestone: null,
    };
  const nextMilestone =
    prev.nextMilestone === null
      ? null
      : Math.max(
          prev.nextMilestone,
          TALK_FEEDBACK_NUDGE_MILESTONES[timesShown],
        );
  return {
    ...prev,
    timesShown,
    nextMilestone,
    nudgePending:
      nextMilestone !== null && prev.completedDictations < nextMilestone
        ? false
        : prev.nudgePending,
  };
}

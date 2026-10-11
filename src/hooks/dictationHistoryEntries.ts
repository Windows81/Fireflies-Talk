import {
  findMilestone,
  getMilestoneProgress,
  toDictationDayKeys,
} from "./dictationStats";
import { countWords } from "./dictationTracking";

export interface DictationEntry {
  id: string;
  text: string;
  date: string;
  userId: string;
  rawText?: string;
  cleanedText?: string;
  dictationId?: string;
  /**
   * What produced this entry. "dictate" and "command" were spoken; "polish"
   * rewrites text the user selected, so nothing was said. Absent on entries
   * written before this existed, which are treated as dictation.
   */
  kind?: "dictate" | "command" | "polish";
  /** Cleaned name of the app the text was pasted into, when known. */
  pastedApp?: string;
  /** False once a paste attempt failed, so the row can say so. */
  pasted?: boolean;
}

export const MAX_DICTATION_HISTORY = 500;

export function appendDictationHistory(
  entries: DictationEntry[],
  incoming: Omit<DictationEntry, "id"> & { id?: string },
  now = Date.now(),
): DictationEntry[] {
  return [
    {
      ...incoming,
      id: incoming.id ?? `${now}-${Math.random().toString(36).slice(2, 8)}`,
    },
    ...entries,
  ].slice(0, MAX_DICTATION_HISTORY);
}

/**
 * Records a paste outcome on the row with this id. Two dictations can share
 * text, so the result is addressed by id rather than by matching the body.
 */
export function markDictationPasted(
  entries: DictationEntry[],
  result: { id: string; pasted: boolean },
): DictationEntry[] {
  const index = entries.findIndex((entry) => entry.id === result.id);
  if (index === -1) return entries;

  const next = [...entries];
  next[index] = { ...next[index], pasted: result.pasted };
  return next;
}

/**
 * Words dictated per user, keyed by user id. Kept alongside the entries
 * because `entries` is capped at MAX_DICTATION_HISTORY — summing it would
 * quietly drop everything older than the cap.
 */
export type DictationLifetimeWords = Record<string, number>;

/** Day keys a user dictated on, keyed by user id — see DictationActiveDays. */
export type DictationActiveDays = Record<string, string[]>;

/**
 * Spoken dictations per user, keyed by user id. Milestones (the feedback offer
 * after 10 dictations, and so on) key off this rather than the entries, so
 * deleting or clearing the history can never earn an offer twice.
 */
export type DictationCounts = Record<string, number>;

/**
 * Roughly a year of activity per user. The streak and month grid only ever
 * look back over recent days, so older keys are dropped rather than grown
 * without bound.
 */
export const MAX_ACTIVE_DAYS = 400;

/** "polish" rewrites selected text, so nothing was said. */
const isSpoken = (entry: Pick<DictationEntry, "kind">): boolean =>
  entry.kind !== "polish";

/**
 * Words the user actually spoke. `text` is what got pasted, which for a
 * command is generated output and for a polish is the user's own selection —
 * counting either would overstate how much was dictated.
 */
export const countSpokenWords = (
  entry: Pick<DictationEntry, "text" | "rawText" | "kind">,
): number => {
  if (!isSpoken(entry)) return 0;
  return countWords(entry.rawText ?? entry.text);
};

const sumUserWords = (entries: DictationEntry[], userId: string): number =>
  entries.reduce(
    (total, entry) =>
      entry.userId === userId ? total + countSpokenWords(entry) : total,
    0,
  );

/**
 * A user's lifetime word count. Falls back to their retained history for users
 * last seen before the counter existed.
 */
export function getLifetimeWords(
  state: {
    entries: DictationEntry[];
    lifetimeWords?: DictationLifetimeWords;
  },
  userId: string | undefined,
): number {
  if (!userId) return 0;
  return state.lifetimeWords?.[userId] ?? sumUserWords(state.entries, userId);
}

/** The counter after `entry` is accepted into the history. */
export function addLifetimeWords(
  state: {
    entries: DictationEntry[];
    lifetimeWords?: DictationLifetimeWords;
  },
  entry: Omit<DictationEntry, "id">,
): DictationLifetimeWords {
  return {
    ...state.lifetimeWords,
    [entry.userId]:
      getLifetimeWords(state, entry.userId) + countSpokenWords(entry),
  };
}

/**
 * A user's active day keys. Falls back to their retained history for users
 * last seen before the aggregate existed.
 */
export function getActiveDays(
  state: {
    entries: DictationEntry[];
    activeDays?: DictationActiveDays;
  },
  userId: string | undefined,
): string[] {
  if (!userId) return [];
  const stored = state.activeDays?.[userId];
  if (stored) return stored;
  return toDictationDayKeys(
    state.entries.filter((entry) => entry.userId === userId && isSpoken(entry)),
  );
}

/**
 * How many dictations a user has spoken. Falls back to their retained history
 * for users last seen before the counter existed.
 */
export function getDictationCount(
  state: {
    entries: DictationEntry[];
    dictationCounts?: DictationCounts;
  },
  userId: string | undefined,
): number {
  if (!userId) return 0;
  return (
    state.dictationCounts?.[userId] ??
    state.entries.filter((entry) => entry.userId === userId && isSpoken(entry))
      .length
  );
}

/** The counter after `entry` is accepted into the history. */
export function addDictationCount(
  state: {
    entries: DictationEntry[];
    dictationCounts?: DictationCounts;
  },
  entry: Omit<DictationEntry, "id">,
): DictationCounts {
  return {
    ...state.dictationCounts,
    [entry.userId]:
      getDictationCount(state, entry.userId) + (isSpoken(entry) ? 1 : 0),
  };
}

type DictationHistoryState = {
  entries: DictationEntry[];
  lifetimeWords?: DictationLifetimeWords;
  activeDays?: DictationActiveDays;
  dictationCounts?: DictationCounts;
};

/**
 * Stores a user's stats explicitly. The aggregates fall back to the entries
 * for users last seen before they existed, so they must be pinned before any
 * entry is dropped or the streak and word count would shrink with the history.
 */
function pinUserDictationStats(state: DictationHistoryState, userId: string) {
  return {
    lifetimeWords: {
      ...state.lifetimeWords,
      [userId]: getLifetimeWords(state, userId),
    } satisfies DictationLifetimeWords,
    activeDays: {
      ...state.activeDays,
      [userId]: getActiveDays(state, userId),
    } satisfies DictationActiveDays,
    dictationCounts: {
      ...state.dictationCounts,
      [userId]: getDictationCount(state, userId),
    } satisfies DictationCounts,
  };
}

/** Drops one entry while keeping its owner's stats. */
export function removeDictationEntry(
  state: DictationHistoryState,
  id: string,
): DictationHistoryState {
  const entry = state.entries.find((candidate) => candidate.id === id);
  if (!entry) return state;
  return {
    ...pinUserDictationStats(state, entry.userId),
    entries: state.entries.filter((candidate) => candidate.id !== id),
  };
}

/** Drops a user's entries while keeping their stats. */
export function clearUserDictationHistory(
  state: DictationHistoryState,
  userId: string,
) {
  return {
    ...pinUserDictationStats(state, userId),
    entries: state.entries.filter((entry) => entry.userId !== userId),
  };
}

/** The active days after `entry` is accepted into the history. */
export function addActiveDay(
  state: {
    entries: DictationEntry[];
    activeDays?: DictationActiveDays;
  },
  entry: Omit<DictationEntry, "id">,
) {
  if (entry.kind === "polish") {
    return { ...state.activeDays } satisfies DictationActiveDays;
  }

  const [dayKey] = toDictationDayKeys([{ ...entry, id: "" }]);
  const days = getActiveDays(state, entry.userId);
  // An unparseable date has no day to record.
  if (!dayKey) {
    return {
      ...state.activeDays,
      [entry.userId]: days,
    } satisfies DictationActiveDays;
  }

  const next = days.includes(dayKey) ? days : [...days, dayKey];
  return {
    ...state.activeDays,
    [entry.userId]: next.sort().slice(-MAX_ACTIVE_DAYS),
  } satisfies DictationActiveDays;
}

/**
 * The highest rung each user has been congratulated for, as that rung's own
 * word count, keyed by user id. Held so a milestone celebrates once and once
 * only. A word count rather than a tally of rungs: a rung inserted below
 * someone's total would push a tally up and fire a celebration they never
 * earned, while a threshold in words is unmoved by it.
 */
export type DictationCelebratedMilestones = Record<string, number>;

/**
 * A stored rung the ladder still has. One it has dropped can be neither named
 * on the card nor opened from it, so it is dead: it must not be offered, and
 * must not go on holding the single pending slot against later milestones.
 */
export const isLiveMilestone = (pending: PendingMilestone): boolean =>
  findMilestone(pending.milestoneWords) !== undefined;

/** A milestone crossed but not yet shown to the user. */
export interface PendingMilestone {
  userId: string;
  /** The rung's own word count, which identifies it — see findMilestone. */
  milestoneWords: number;
  /** Lifetime total at the moment it unlocked, for the share card. */
  totalWords: number;
}

/**
 * The highest rung this user has been congratulated for, in words. Seeds from
 * their existing total rather than from zero, so installing this feature on top
 * of 200,000 dictated words does not fire a dozen celebrations at once — only
 * crossings from here on count.
 */
export function getCelebratedMilestones(
  state: {
    entries: DictationEntry[];
    lifetimeWords?: DictationLifetimeWords;
    celebratedMilestones?: DictationCelebratedMilestones;
  },
  userId: string | undefined,
): number {
  if (!userId) return 0;
  return (
    state.celebratedMilestones?.[userId] ??
    getMilestoneProgress(getLifetimeWords(state, userId)).reached?.words ??
    0
  );
}

/**
 * The celebration state after a dictation takes the user to `totalWordsAfter`.
 * A single long dictation can clear more than one rung; only the highest is
 * celebrated, since the lower ones are already implied by it.
 *
 * `slotTaken` says a card is already waiting to be seen. The count only moves
 * for a milestone that actually reaches the slot — marking one celebrated that
 * was never shown would lose it, since nothing looks back at old crossings.
 *
 * An entry that carries no spoken words moves nobody past a rung, so it never
 * celebrates: a polish rewrites text the user selected, and congratulating them
 * for a milestone crossed some dictations ago would arrive out of nowhere.
 */
export function toMilestoneUnlock(
  state: {
    entries: DictationEntry[];
    lifetimeWords?: DictationLifetimeWords;
    celebratedMilestones?: DictationCelebratedMilestones;
  },
  entry: Omit<DictationEntry, "id">,
  totalWordsAfter: number,
  slotTaken = false,
): { celebrated: number; pending?: PendingMilestone } {
  const seen = getCelebratedMilestones(state, entry.userId);
  if (countSpokenWords(entry) === 0) return { celebrated: seen };

  const { reached } = getMilestoneProgress(totalWordsAfter);
  if (!reached || reached.words <= seen || slotTaken) {
    return { celebrated: seen };
  }

  return {
    celebrated: reached.words,
    pending: {
      userId: entry.userId,
      milestoneWords: reached.words,
      totalWords: totalWordsAfter,
    },
  };
}

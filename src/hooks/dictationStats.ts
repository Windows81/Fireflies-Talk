import { getDaysInMonth, startOfMonth, subDays } from "date-fns";
import { toDayKey } from "./dictationDayClock";
import type { DictationEntry } from "./dictationHistoryEntries";
import { countWords } from "./dictationTracking";

export const getTotalWords = (entries: DictationEntry[]): number =>
  entries.reduce((total, entry) => total + countWords(entry.text), 0);

/** Thousands-separated so a six-figure total stays readable at a glance. */
export const formatWordCount = (totalWords: number): string =>
  totalWords.toLocaleString("en-US");

export const toDictationDayKeys = (entries: DictationEntry[]): string[] => {
  const keys = new Set<string>();
  for (const entry of entries) {
    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime())) continue;
    keys.add(toDayKey(date));
  }
  return [...keys];
};

const getStreakStart = (days: Set<string>, now: Date): Date | undefined => {
  if (days.has(toDayKey(now))) return now;

  const yesterday = subDays(now, 1);
  if (days.has(toDayKey(yesterday))) return yesterday;

  return undefined;
};

const collectStreakKeys = (days: Set<string>, start: Date): string[] => {
  const keys = Array.from({ length: 400 }, (_, offset) =>
    toDayKey(subDays(start, offset)),
  );

  const gap = keys.findIndex((key) => !days.has(key));
  return gap === -1 ? keys : keys.slice(0, gap);
};

/**
 * Day keys in the streak running up to `now`, newest first. Takes day keys
 * rather than entries so a streak survives the history cap evicting the
 * entries it was built from. A day with no
 * dictation only breaks the streak once it's over, so yesterday-but-not-today
 * still counts — otherwise every streak would read 0 until the first dictation
 * of the morning. Streaks run across month boundaries; the month grid shows
 * whichever of these days fall inside the month on screen.
 */
export const getStreakDayKeys = (
  activeDays: Iterable<string>,
  now = new Date(),
): string[] => {
  const days = new Set(activeDays);
  if (days.size === 0) return [];

  const start = getStreakStart(days, now);
  if (!start) return [];

  return collectStreakKeys(days, start);
};

export const getStreakDays = (
  activeDays: Iterable<string>,
  now = new Date(),
): number => getStreakDayKeys(activeDays, now).length;

export interface DictationDayCell {
  key: string;
  day: number;
  /** This day has at least one dictation. */
  active: boolean;
  /** This day is part of the streak running up to today. */
  inStreak: boolean;
}

/**
 * One cell per day of `now`'s month. Cells carry both states so the grid can
 * show the live streak apart from earlier activity in the same month.
 */
export const getMonthActivity = (
  activeDays: Iterable<string>,
  now = new Date(),
): DictationDayCell[] => {
  const days = new Set(activeDays);
  const streak = new Set(getStreakDayKeys(days, now));
  const monthStart = startOfMonth(now);

  return Array.from({ length: getDaysInMonth(now) }, (_, index) => {
    const date = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      index + 1,
    );
    const key = toDayKey(date);
    return {
      key,
      day: index + 1,
      active: days.has(key),
      inStreak: streak.has(key),
    };
  });
};

export interface WordMilestone {
  words: number;
  /**
   * Reads after "% of " and after "more words than" — carries its own article.
   */
  name: string;
}

/**
 * Twenty named works of a known length, smallest first — songs, speeches,
 * scripts and games as well as books, so the comparison keeps surprising. The
 * first is reachable in a single sitting; the gaps widen from there, so the
 * ladder keeps its pull for years. Everything on it is known well beyond any
 * one country.
 *
 * The book counts are the published figures. The spoken and on-screen works
 * are counted from their transcripts and rounded, because no official figure
 * exists for a stand-up set or a screenplay — the round numbers say so.
 */
export const WORD_MILESTONES: WordMilestone[] = [
  { words: 360, name: "the lyrics of Bohemian Rhapsody" },
  { words: 769, name: "Green Eggs and Ham" },
  { words: 1_560, name: "Eminem's Rap God" },
  { words: 2_200, name: "Steve Jobs' Stanford commencement address" },
  { words: 4_000, name: "Bob Dylan's Nobel Lecture" },
  { words: 16_534, name: "The Little Prince" },
  { words: 18_110, name: "Macbeth" },
  { words: 26_432, name: "Alice's Adventures in Wonderland" },
  { words: 29_966, name: "Animal Farm" },
  { words: 47_094, name: "The Great Gatsby" },
  { words: 76_944, name: "Harry Potter and the Philosopher's Stone" },
  { words: 95_356, name: "The Hobbit" },
  { words: 122_189, name: "Pride and Prejudice" },
  { words: 144_523, name: "One Hundred Years of Solitude" },
  { words: 206_052, name: "Moby-Dick" },
  { words: 298_000, name: "A Game of Thrones" },
  { words: 450_000, name: "the script of The Witcher 3" },
  { words: 587_287, name: "War and Peace" },
  { words: 884_647, name: "the complete works of Shakespeare" },
  { words: 1_084_170, name: "the entire Harry Potter series" },
];

const TOP_MILESTONE = WORD_MILESTONES[WORD_MILESTONES.length - 1];

/**
 * A rung by its own word count, which is what gets stored — a position would
 * point somewhere else the moment the ladder gains, loses or reorders a rung.
 * Absent when that rung is no longer on the ladder.
 */
export const findMilestone = (words: number): WordMilestone | undefined =>
  WORD_MILESTONES.find((milestone) => milestone.words === words);

export interface MilestoneProgress {
  /** Highest milestone already passed, absent before the first one. */
  reached?: WordMilestone;
  /** The one being worked toward, absent once the ladder is finished. */
  next?: WordMilestone;
  /** Milestones unlocked so far, out of WORD_MILESTONES.length. */
  unlocked: number;
  /** Words still to dictate before `next` unlocks (strictly past its length). */
  wordsToNext: number;
  /** 0–1 of the way to `next`, counted from zero: how much of that thing the
   * user has now said. 1 once the ladder is finished. */
  progress: number;
}

export const getMilestoneProgress = (totalWords: number): MilestoneProgress => {
  const words = Math.max(0, totalWords);
  // Strictly past, not level with: every surface says "more words than", and
  // at exactly the milestone's length that would be a lie on a public post.
  const unlocked = WORD_MILESTONES.filter(
    (milestone) => words > milestone.words,
  ).length;
  const reached = unlocked > 0 ? WORD_MILESTONES[unlocked - 1] : undefined;
  const next = WORD_MILESTONES[unlocked];

  if (!next) return { reached, unlocked, wordsToNext: 0, progress: 1 };

  return {
    reached,
    next,
    unlocked,
    wordsToNext: next.words - words + 1,
    progress: words / next.words,
  };
};

/**
 * Warm openers for the progress line. Which one shows is derived from the
 * milestone and how far into it the user is, so it holds still between renders
 * and changes as they climb rather than flickering word to word.
 */
const MILESTONE_PRAISE = [
  "Wow",
  "Impressive",
  "Awesome",
  "Nice work",
  "Congrats",
  "Incredible",
  "Brilliant",
  "Amazing",
];

const praiseFor = (unlocked: number, percent: number): string =>
  MILESTONE_PRAISE[
    (unlocked * 10 + Math.floor(percent / 10)) % MILESTONE_PRAISE.length
  ];

/**
 * Praise only from halfway up the current milestone. "Impressive!" over a tenth
 * of a song reads as flattery and cheapens the openers that come later, so the
 * line states the figure plainly until the user is genuinely most of the way
 * there.
 */
const PRAISE_MIN_PERCENT = 50;

/**
 * "Wow! That's 60% of The Little Prince." — how much of the next thing on the
 * ladder the user has now said, or multiples of the largest one for anyone past
 * the top. Absent while the share still rounds to nothing: "0% of Bohemian
 * Rhapsody" is a comparison to nothing, and at no words there is not yet
 * anything to compare.
 */
export const describeMilestoneProgress = (
  totalWords: number,
): string | undefined => {
  if (totalWords <= 0) return undefined;

  const { next, progress, unlocked } = getMilestoneProgress(totalWords);
  const percent = Math.min(100, Math.round(progress * 100));
  if (next && percent < 1) return undefined;

  const amount = next
    ? `${percent}% of ${next.name}`
    : `${Math.floor(totalWords / TOP_MILESTONE.words)}× ${TOP_MILESTONE.name}`;

  if (percent < PRAISE_MIN_PERCENT) return `That's ${amount}.`;
  return `${praiseFor(unlocked, percent)}! That's ${amount}.`;
};

/**
 * Typing and speaking rates in words per minute. The gap between them is what
 * dictating a word actually buys you, and it is the figure worth sharing —
 * "nine hours saved" lands where a raw word count does not.
 */
const TYPING_WPM = 40;
const DICTATION_WPM = 150;

export const getMinutesSaved = (totalWords: number): number =>
  Math.max(0, totalWords) * (1 / TYPING_WPM - 1 / DICTATION_WPM);

export interface TimeSaved {
  /** Thousands-separated, so it can stand alone as a figure. */
  amount: string;
  /** "hours" / "minutes", already matched to the amount. */
  unit: string;
}

/**
 * Time saved split into its figure and its unit, so a layout can set the two
 * apart. Rounded, because the rates behind it are averages anyway.
 */
export const getTimeSaved = (totalWords: number): TimeSaved => {
  const minutes = Math.round(getMinutesSaved(totalWords));
  if (minutes < 60) {
    return {
      amount: formatWordCount(minutes),
      unit: minutes === 1 ? "minute" : "minutes",
    };
  }

  const hours = Math.round(minutes / 60);
  return {
    amount: formatWordCount(hours),
    unit: hours === 1 ? "hour" : "hours",
  };
};

/** "9 hours" / "45 minutes", for running text. */
export const describeTimeSaved = (totalWords: number): string => {
  const { amount, unit } = getTimeSaved(totalWords);
  return `${amount} ${unit}`;
};

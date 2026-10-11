import { format } from "date-fns";

const DAY_KEY = "yyyy-MM-dd";
const MAX_DAY_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export const toDayKey = (date: Date): string => format(date, DAY_KEY);

/** Milliseconds from `now` to the next local midnight, never zero. */
export const msUntilNextLocalMidnight = (now: Date): number => {
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return Math.max(1, midnight.getTime() - now.getTime());
};

/**
 * How long to wait before re-checking the day. Capped well below a full day so
 * a clock change, a timezone change, or a machine waking from sleep is noticed
 * soon after rather than only at the next scheduled midnight.
 */
export const nextDayCheckDelayMs = (now: Date): number =>
  Math.min(msUntilNextLocalMidnight(now), MAX_DAY_CHECK_INTERVAL_MS);

import {
  endOfWeek,
  format,
  formatDistance,
  isSameYear,
  isValid,
  startOfWeek,
} from "date-fns";

export type TimestampInput = Date | string | number | null | undefined;

export type WeekGrouped<T> = {
  isCurrentWeek: boolean;
  startTime: Date;
  endTime: Date;
  items: T[];
};

export function groupByWeeks<
  T extends {
    startTime?: Date | string | null;
    date?: Date | string | null;
  },
>(items: T[]): WeekGrouped<T>[] {
  const groupedItems = items.reduce(
    (acc, item) => {
      const dateStr = item.startTime || item.date;
      if (!dateStr) {
        return acc;
      }
      const date = new Date(dateStr);
      const week = startOfWeek(date).getTime();

      if (!acc[week]) {
        acc[week] = [];
      }

      acc[week].push(item);
      return acc;
    },
    {} as Record<number, T[]>,
  );

  const thisWeek = startOfWeek(new Date()).getTime();

  return Object.entries(groupedItems)
    .map(([weekStr, items]) => {
      const week = Number(weekStr);

      return {
        isCurrentWeek: week === thisWeek,
        startTime: new Date(week),
        endTime: endOfWeek(week),
        items: items.sort((a, b) => {
          const aDate = a.startTime || a.date;
          const bDate = b.startTime || b.date;
          if (!aDate || !bDate) {
            return 0;
          }
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }),
      };
    })
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

export function getWeekGroupLabel(section: { startTime: Date; endTime: Date }) {
  const isInSameYear = isSameYear(section.startTime, section.endTime);
  const isSameYearAsNow = isSameYear(section.startTime, new Date());
  const dateFormat = isInSameYear && isSameYearAsNow ? "MMM d" : "MMM d, yyyy";

  return `${format(section.startTime, dateFormat)} - ${format(section.endTime, dateFormat)}`;
}

/**
 * Parses a timestamp coming off the API, which types `createdAt` as an untyped scalar and sends
 * either an ISO string or epoch milliseconds (as a number or a digit-only string). Returns `null`
 * for anything unparseable.
 */
export function parseTimestamp(value: TimestampInput): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const epochMilliseconds = Number(value);
  const date = Number.isNaN(epochMilliseconds)
    ? new Date(value)
    : new Date(epochMilliseconds);

  return isValid(date) ? date : null;
}

/**
 * Distance from now with a suffix, e.g. "5 minutes ago". `baseDate` defaults to the current time
 * resolved per call, so a long-lived session never measures against a stale reference. Timestamps
 * ahead of the device clock are clamped to the reference, because server/device clock skew must
 * never render a just-created item as a future date. Only for timestamps expected to be in the
 * past (e.g. `createdAt`) — for genuinely future dates, use `date-fns`' `formatDistanceToNow`
 * directly.
 */
export function formatPastRelativeTime(
  value: TimestampInput,
  baseDate: Date = new Date(),
): string {
  const date = parseTimestamp(value);
  if (!date) {
    return "";
  }

  const notInTheFuture = date.getTime() > baseDate.getTime() ? baseDate : date;

  return formatDistance(notInTheFuture, baseDate, { addSuffix: true });
}

/** Returns a day number with its English ordinal suffix (1st, 2nd, 3rd, 4th…). */
export function ordinalDay(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

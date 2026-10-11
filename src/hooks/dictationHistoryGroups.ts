import { format, isSameDay, subDays } from "date-fns";
import { toDayKey } from "./dictationDayClock";
import type { DictationEntry } from "./dictationHistoryEntries";

export interface DictationDayGroup {
  key: string;
  label: string;
  entries: DictationEntry[];
}

/** "TODAY" / "YESTERDAY" for the recent days, the full date before that. */
export const formatDictationDayLabel = (
  date: Date,
  now = new Date(),
): string => {
  if (isSameDay(date, now)) return "TODAY";
  if (isSameDay(date, subDays(now, 1))) return "YESTERDAY";
  return format(date, "MMMM d, yyyy").toUpperCase();
};

export const groupEntriesByDay = (
  entries: DictationEntry[],
  now = new Date(),
): DictationDayGroup[] => {
  const groups: DictationDayGroup[] = [];
  const dayIndex = new Map<string, number>();

  for (const entry of entries) {
    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime())) continue;

    const key = toDayKey(date);
    const existingIndex = dayIndex.get(key);

    if (existingIndex === undefined) {
      dayIndex.set(key, groups.length);
      groups.push({
        key,
        label: formatDictationDayLabel(date, now),
        entries: [entry],
      });
      continue;
    }

    groups[existingIndex].entries.push(entry);
  }

  return groups;
};

export const listPasteTargets = (entries: DictationEntry[]): string[] => {
  const targets = new Set<string>();
  for (const entry of entries) {
    if (entry.pastedApp) targets.add(entry.pastedApp);
  }
  return [...targets].sort((a, b) => a.localeCompare(b));
};

export interface DictationHistoryFilters {
  /** Case-insensitive substring match across every dictation, any day. */
  query?: string;
  /** Paste targets to keep. Empty or omitted means every app. */
  apps?: string[];
}

export const filterDictationEntries = (
  entries: DictationEntry[],
  filters: DictationHistoryFilters = {},
): DictationEntry[] => {
  const needle = filters.query?.trim().toLowerCase();
  const apps = filters.apps?.length ? new Set(filters.apps) : null;
  if (!needle && !apps) return entries;

  return entries.filter((entry) => {
    if (needle && !entry.text.toLowerCase().includes(needle)) return false;
    // An entry with no known target cannot match a specific app.
    if (apps && (!entry.pastedApp || !apps.has(entry.pastedApp))) return false;
    return true;
  });
};

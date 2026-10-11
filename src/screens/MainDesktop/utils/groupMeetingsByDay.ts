import type { Source } from "@/graphql";
import { format } from "date-fns";

export const getMeetingDayLabel = (date: Date): string =>
  format(date, "eee, MMM d");

const getMeetingDayKey = (date: Date): string => format(date, "yyyy-MM-dd");

export const groupMeetingsByDay = (
  meetings: Source[],
): { key: string; day: string; meetings: Source[] }[] => {
  const groups: { key: string; day: string; meetings: Source[] }[] = [];
  const dayIndex = new Map<string, number>();

  for (const meeting of meetings) {
    if (!meeting.date) continue;
    const date = new Date(meeting.date);
    const key = getMeetingDayKey(date);
    const day = getMeetingDayLabel(date);
    const existingIndex = dayIndex.get(key);

    if (existingIndex === undefined) {
      dayIndex.set(key, groups.length);
      groups.push({ key, day, meetings: [meeting] });
      continue;
    }

    groups[existingIndex].meetings.push(meeting);
  }

  return groups;
};

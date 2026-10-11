import type { CalendarEvents } from "@/graphql";
import { isToday } from "date-fns";
import { isEventHappeningAt } from "./eventTiming";

function isEventToday(event: CalendarEvents): boolean {
  if (!event.date) return false;

  const start = new Date(event.date);
  if (isToday(start)) return true;

  if (!event.endDate) return false;
  if (isToday(new Date(event.endDate))) return true;

  return isEventHappeningAt(event, Date.now());
}

export function filterCalendarEvents(
  events: CalendarEvents[] | undefined,
): CalendarEvents[] {
  if (!events?.length) return [];
  return events.filter(isEventToday);
}

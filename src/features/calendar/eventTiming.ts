import type { CalendarEvents } from "@/graphql";

const DEFAULT_EVENT_DURATION_MS = 3_600_000;

/** Events without an end time are assumed to last one hour. */
export function getEventEndTime(event: CalendarEvents): number {
  if (event.endDate) return new Date(event.endDate).getTime();
  if (event.date)
    return new Date(event.date).getTime() + DEFAULT_EVENT_DURATION_MS;
  return 0;
}

export function isEventHappeningAt(event: CalendarEvents, at: number): boolean {
  if (!event.date) return false;
  return new Date(event.date).getTime() <= at && getEventEndTime(event) >= at;
}

// Events with a conferencing link are real calls rather than personal blocks
// such as "Focus time", so they win over link-less overlapping events.
function currentEventRank(event: CalendarEvents): number {
  return event.url ? 1 : 0;
}

/**
 * The meeting most likely being recorded right now: a real, non-cancelled event
 * happening at `at`, preferring conferencing events and then the most recent
 * start so overlapping all-day blocks never win over an actual meeting.
 */
export function findCurrentEvent(
  events: CalendarEvents[],
  at: number,
): CalendarEvents | undefined {
  let current: CalendarEvents | undefined;

  for (const event of events) {
    if (!event.title || event.cancelReason || event.isValidMeeting === false) {
      continue;
    }
    if (!isEventHappeningAt(event, at)) continue;

    if (!current) {
      current = event;
      continue;
    }

    const rankDelta = currentEventRank(event) - currentEventRank(current);
    const startsLater =
      new Date(event.date!).getTime() > new Date(current.date!).getTime();
    if (rankDelta > 0 || (rankDelta === 0 && startsLater)) current = event;
  }

  return current;
}

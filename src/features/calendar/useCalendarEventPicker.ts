import type { CalendarEvents } from "@/graphql";
import { format, isValid } from "date-fns";
import { filterCalendarEvents } from "./filterCalendarEvents";
import { useUpcomingCalendarEvents } from "./useUpcomingCalendarEvents";

export interface CalendarEventPicker {
  events: CalendarEvents[];
  isLoading: boolean;
  dateLabel: string;
}

/**
 * Today's calendar events plus the meeting date label, shared by every
 * calendar-event picker so the pickers cannot drift apart.
 */
export const useCalendarEventPicker = (
  startTime: string | number | Date | null | undefined,
): CalendarEventPicker => {
  const { events: allEvents, isLoadingEvents } = useUpcomingCalendarEvents();

  const meetingDate = startTime ? new Date(startTime) : new Date();

  return {
    events: filterCalendarEvents(allEvents),
    isLoading: !!isLoadingEvents,
    dateLabel: isValid(meetingDate)
      ? format(meetingDate, "EEE, d MMM")
      : "Today",
  };
};

import type { CalendarEvents } from "@/graphql";
import { format, isToday, isTomorrow } from "date-fns";

export const getDay = (date: Date) => {
  if (isToday(date)) return `Today, ${format(date, "MMM dd")}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, "MMM dd")}`;
  return format(date, "eee, MMM dd");
};

export const groupByDay = (events: CalendarEvents[]) => {
  return events.reduce(
    (acc, event) => {
      if (!event.date) return acc;
      const date = new Date(event.date);
      const day = getDay(date);
      const dayEvents = acc[day] || [];
      dayEvents.push(event);
      acc[day] = dayEvents;
      return acc;
    },
    {} as Record<string, CalendarEvents[]>,
  );
};

import {
  useCalendarEventPicker,
  useMeetingCalendarEventLink,
} from "@/features/calendar";
import type { CalendarEvents } from "@/graphql";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";

export interface CalendarEventConnection {
  events: CalendarEvents[];
  isLoading: boolean;
  connectedEventTitle: string | null;
  connectEvent: (event: CalendarEvents) => void;
  disconnectEvent: () => void;
  dateLabel: string;
}

export const useCalendarEventConnection = (): CalendarEventConnection => {
  const { meeting } = useDesktopNotepadContext();
  const { events, isLoading, dateLabel } = useCalendarEventPicker(
    meeting.startTime,
  );
  const { connectedEventTitle, connectEvent, disconnectEvent } =
    useMeetingCalendarEventLink(meeting.id, meeting.title);

  return {
    events,
    isLoading,
    connectedEventTitle,
    connectEvent,
    disconnectEvent,
    dateLabel,
  };
};

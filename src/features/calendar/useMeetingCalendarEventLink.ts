import { useMutation } from "@apollo/client";
import type { CalendarEvents } from "@/graphql";
import {
  UpdateMeetingDocument,
  type MeetingAttendeeInput,
} from "@firefliesai/mobile-ff.graphql-client";
import { applyMeetingTitleRename } from "@/features/meeting/utils/title-sync";
import { useCallback, useRef, useState } from "react";

export interface MeetingCalendarEventLink {
  connectedEventTitle: string | null;
  connectEvent: (event: CalendarEvents) => void;
  disconnectEvent: () => void;
}

function toAttendeeInputs(event: CalendarEvents): MeetingAttendeeInput[] {
  return (event.attendees ?? [])
    .filter((attendee) => !!attendee?.email)
    .map((attendee) => ({
      email: attendee!.email!,
      organizer: attendee!.organizer ?? false,
      responseStatus: attendee!.responseStatus,
    }));
}

/**
 * Links a meeting to a calendar event: adopts the event title and attendees,
 * and restores the previous title when disconnected.
 */
export const useMeetingCalendarEventLink = (
  meetingId: string,
  meetingTitle: string | null | undefined,
): MeetingCalendarEventLink => {
  const [updateMeeting] = useMutation(UpdateMeetingDocument);
  const [connectedEventTitle, setConnectedEventTitle] = useState<string | null>(
    null,
  );
  const titleBeforeConnectRef = useRef<string | null>(null);

  const connectEvent = useCallback(
    (event: CalendarEvents) => {
      if (!event.title) return;

      // Only the first link captures the restore point, so switching events
      // still restores the title the meeting had before any calendar link.
      if (titleBeforeConnectRef.current === null) {
        titleBeforeConnectRef.current = meetingTitle ?? "";
      }
      setConnectedEventTitle(event.title);

      const attendees = toAttendeeInputs(event);

      applyMeetingTitleRename(meetingId, event.title);

      updateMeeting({
        variables: {
          id: meetingId,
          title: event.title,
          ...(attendees.length > 0 && { attendees }),
        },
      });
    },
    [meetingId, meetingTitle, updateMeeting],
  );

  const disconnectEvent = useCallback(() => {
    const previousTitle = titleBeforeConnectRef.current || "";
    setConnectedEventTitle(null);
    titleBeforeConnectRef.current = null;

    applyMeetingTitleRename(meetingId, previousTitle);

    updateMeeting({
      variables: {
        id: meetingId,
        title: previousTitle,
        attendees: [],
      },
    });
  }, [meetingId, updateMeeting]);

  return { connectedEventTitle, connectEvent, disconnectEvent };
};

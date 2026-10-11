import { getEventEndTime } from "@/features/calendar/eventTiming";
import type { CalendarEvents } from "@/graphql";
import type { RecordingSource, RecordingSourceAttendee } from "./types";

interface CalendarEventAttendee {
  email?: string | null;
  organizer?: boolean | null;
  responseStatus?: string | null;
}

/**
 * Maps a calendar event's attendees to the recording source attendee shape so
 * they can be synced onto the meeting. Drops entries without an email.
 */
export const toRecordingSourceAttendees = (
  attendees:
    | ReadonlyArray<CalendarEventAttendee | null | undefined>
    | null
    | undefined,
): RecordingSourceAttendee[] =>
  (attendees ?? []).flatMap((attendee) =>
    attendee?.email
      ? [
          {
            email: attendee.email,
            organizer: attendee.organizer,
            responseStatus: attendee.responseStatus,
          },
        ]
      : [],
  );

/** Recordings may run slightly past the scheduled end without losing their event link. */
export const CALENDAR_EVENT_OVERRUN_GRACE_MS = 15 * 60 * 1000;

/**
 * Scheduled window of a calendar event in the recording source shape. Events
 * without a usable date have no window, which keeps the attendee sync enabled.
 */
export const toRecordingSourceCalendarWindow = (
  event: CalendarEvents | null | undefined,
): Pick<RecordingSource, "eventStartTime" | "eventEndTime"> => {
  const endTime = event ? getEventEndTime(event) : 0;
  if (!endTime) return {};

  return {
    eventStartTime: event?.date
      ? new Date(event.date).toISOString()
      : undefined,
    eventEndTime: new Date(endTime).toISOString(),
  };
};

/**
 * A capture that runs materially past its calendar event is no longer that
 * event's meeting, so its attendees must not be stamped onto the transcript.
 */
export const isRecordingWithinCalendarEvent = (
  source: Pick<RecordingSource, "eventEndTime"> | undefined,
  recordingEndedAt: number,
): boolean => {
  const end = source?.eventEndTime
    ? new Date(source.eventEndTime).getTime()
    : NaN;
  if (!Number.isFinite(end)) return true;

  return recordingEndedAt <= end + CALENDAR_EVENT_OVERRUN_GRACE_MS;
};

import type { CalendarEvents } from "@/graphql";
import { meetingMatchesCalendarEvent } from "./calendarMatch";
import type { LocalMeetingRecord } from "./store";

const CALENDAR_TITLE_MATCH_WINDOW_MS = 5 * 60 * 1000;

export interface DetectedMeetingIdentity {
  url?: string | null;
  platform?: string | null;
  /** Set when `url` was borrowed from a calendar event, not observed. */
  urlFromCalendar?: boolean;
}

const isCalendarEventInWindow = (
  event: CalendarEvents,
  now: number,
): boolean => {
  const start = event.date ? new Date(event.date).getTime() : 0;
  if (!start) return false;
  const end = event.endDate ? new Date(event.endDate).getTime() : 0;

  if (
    start >= now - CALENDAR_TITLE_MATCH_WINDOW_MS &&
    start <= now + CALENDAR_TITLE_MATCH_WINDOW_MS
  ) {
    return true;
  }

  if (end && now >= start && now <= end) {
    return true;
  }

  return false;
};

const isSelfDeclined = (event: CalendarEvents): boolean =>
  (event.attendees ?? []).some(
    (attendee) =>
      attendee.self === true &&
      attendee.responseStatus?.toLowerCase() === "declined",
  );

/**
 * The calendar event title for a call the app detected (URL or platform), or
 * null unless exactly one distinct title matches. The time window applies to
 * URL matches too: recurring meetings and personal Zoom rooms reuse the same
 * link across instances.
 */
export const findCalendarTitleForDetectedMeeting = (
  events: CalendarEvents[] | undefined,
  detected: DetectedMeetingIdentity,
  now: number = Date.now(),
): string | null => {
  if (!events?.length) return null;

  const platform = detected.platform?.trim().toLowerCase() ?? "";
  if (
    !detected.url &&
    (!platform ||
      platform.includes("system-audio") ||
      platform.includes("system audio"))
  ) {
    return null;
  }

  // The store enriches URL-less detections (e.g. the Zoom app) with the most
  // recently started overlapping calendar event's URL. Matching on that
  // borrowed link would hide the overlap, so match by platform and time only.
  const identity: DetectedMeetingIdentity = detected.urlFromCalendar
    ? { platform: detected.platform }
    : detected;

  const titles = new Set<string>();

  for (const event of events) {
    const title = event.title?.trim();
    if (!title) continue;
    if (event.cancelReason) continue;
    if (event.isValidMeeting === false) continue;
    if (isSelfDeclined(event)) continue;
    if (!isCalendarEventInWindow(event, now)) continue;
    if (!meetingMatchesCalendarEvent(event, identity, now)) continue;
    titles.add(title);
  }

  // Duplicates of the same meeting (same title, different ids) still resolve;
  // different overlapping meetings resolve to null.
  return titles.size === 1 ? [...titles][0] : null;
};

/**
 * The single calendar title shared by all active (non-ended) detected local
 * meetings, or null when none or several distinct titles match.
 */
export const findCalendarTitleForActiveMeetings = (
  localMeetings: Pick<LocalMeetingRecord, "status" | "event">[],
  events: CalendarEvents[] | undefined,
  now: number = Date.now(),
): string | null => {
  const titles = new Set<string>();

  for (const meeting of localMeetings) {
    if (meeting.status === "ended") continue;
    const title = findCalendarTitleForDetectedMeeting(
      events,
      {
        url: meeting.event.originalUrl,
        platform: meeting.event.platform,
        urlFromCalendar: meeting.event.urlFromCalendar,
      },
      now,
    );
    // With two active calls we cannot tell which one a manual start records.
    if (!title) return null;
    titles.add(title);
  }

  return titles.size === 1 ? [...titles][0] : null;
};

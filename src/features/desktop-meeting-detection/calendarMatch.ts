import type { CalendarEvents, MeetingStatusData } from "@/graphql";
import { getPlatformFromUrl } from "./meetingPlatforms";
import { normalizeUrl } from "./normalizeUrl";

/**
 * Backend `meetingSource` for a meeting the Fireflies bot/puppet joined from a
 * calendar invite. Any other source on a live meeting means the user joined it
 * themselves (e.g. desktop-record, chrome-extension).
 */
export const CALENDAR_LIVE_MEETING_SOURCE = "calendar";

/** A live meeting created by the calendar bot/puppet (not the user joining). */
export const isBotLiveMeeting = (
  meeting: Pick<MeetingStatusData, "meetingSource">,
): boolean =>
  (meeting.meetingSource ?? "").toLowerCase() === CALENDAR_LIVE_MEETING_SOURCE;

const PLATFORM_MATCH_WINDOW_MS = 5 * 60 * 1000;
/** Grace around a calendar event's scheduled window for title-based matching. */
const TITLE_MATCH_WINDOW_MS = 5 * 60 * 1000;

const normalizeTitle = (title?: string | null): string =>
  (title ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const withProtocol = (url: string): string =>
  /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

const getStart = (event: CalendarEvents): number =>
  event.date ? new Date(event.date).getTime() : 0;

const getEnd = (event: CalendarEvents): number =>
  event.endDate ? new Date(event.endDate).getTime() : 0;

/** Calendar event is within its scheduled live window: start <= now < end. */
export const isCalendarEventLive = (
  event: CalendarEvents,
  now: number,
): boolean => {
  const start = getStart(event);
  if (!start) return false;
  const end = getEnd(event);
  return now >= start && (end ? now < end : true);
};

/** True when `platform` reasonably matches the conferencing platform of `eventUrl`. */
const platformMatchesEventUrl = (
  eventUrl: string,
  platform: string,
): boolean => {
  const normalizedPlatform = platform.toLowerCase();
  const platformFromUrl = getPlatformFromUrl(eventUrl);
  if (platformFromUrl) {
    if (normalizedPlatform.includes(platformFromUrl)) return true;
    if (platformFromUrl === "microsoft teams") {
      return (
        normalizedPlatform.includes("teams") ||
        normalizedPlatform.includes("msteams")
      );
    }
    return false;
  }
  return eventUrl.toLowerCase().includes(normalizedPlatform);
};

interface DetectedMeeting {
  url?: string | null;
  platform?: string | null;
}

/**
 * Whether a detected/live meeting (browser tab, local detection, or backend
 * live meeting) refers to the same call as a calendar event. Matches by
 * normalized join URL, and falls back to platform + time window when only a
 * platform is known (audio-only detection).
 */
export const meetingMatchesCalendarEvent = (
  event: CalendarEvents,
  detected: DetectedMeeting,
  now: number = Date.now(),
): boolean => {
  const eventUrl = event.url?.trim();
  if (!eventUrl) return false;

  if (detected.url) {
    return normalizeUrl(withProtocol(eventUrl)) === normalizeUrl(detected.url);
  }

  if (detected.platform) {
    const start = getStart(event);
    if (!start) return false;
    const end = getEnd(event);
    const inWindow =
      (start >= now - PLATFORM_MATCH_WINDOW_MS &&
        start <= now + PLATFORM_MATCH_WINDOW_MS) ||
      (end ? now >= start && now <= end : false);
    return inWindow && platformMatchesEventUrl(eventUrl, detected.platform);
  }

  return false;
};

/** Whether a backend live meeting refers to the same call as a calendar event. */
export const liveMeetingMatchesCalendarEvent = (
  event: CalendarEvents,
  meeting: Pick<MeetingStatusData, "url" | "objectId" | "title" | "startTime">,
  now: number = Date.now(),
): boolean => {
  if (
    event.meetingId &&
    meeting.objectId &&
    meeting.objectId === event.meetingId
  ) {
    return true;
  }
  if (meetingMatchesCalendarEvent(event, { url: meeting.url }, now)) {
    return true;
  }
  // When taking notes from the desktop app (or the bot joining) creates a
  // meeting whose id/url differ from the calendar event, fall back to matching
  // identical titles while the event is within its (grace-padded) live window.
  const eventTitle = normalizeTitle(event.title);
  if (!eventTitle || eventTitle !== normalizeTitle(meeting.title)) return false;
  const start = getStart(event);
  if (!start) return false;
  const end = getEnd(event);
  return (
    now >= start - TITLE_MATCH_WINDOW_MS &&
    (end ? now < end + TITLE_MATCH_WINDOW_MS : true)
  );
};

/**
 * Whether a real-time "Fred joined" signal (SSE `FRED_JOINED_MEETING`) refers to
 * the same call as a calendar event. Matches by meeting id, or by identical
 * title while the event is within its (grace-padded) live window — the latter
 * covers meetings whose backend id differs from the calendar event's.
 */
export const botJoinedMatchesCalendarEvent = (
  event: CalendarEvents,
  signal: { meetingId: string; title?: string | null },
  now: number = Date.now(),
): boolean => {
  if (
    event.meetingId &&
    signal.meetingId &&
    signal.meetingId === event.meetingId
  ) {
    return true;
  }
  const eventTitle = normalizeTitle(event.title);
  if (!eventTitle || eventTitle !== normalizeTitle(signal.title)) return false;
  const start = getStart(event);
  if (!start) return false;
  const end = getEnd(event);
  return (
    now >= start - TITLE_MATCH_WINDOW_MS &&
    (end ? now < end + TITLE_MATCH_WINDOW_MS : true)
  );
};

/** Whether the user explicitly claimed (e.g. clicked Join) for this event. */
export const isCalendarEventClaimed = (
  event: CalendarEvents,
  claims: { eventId: string; until: number }[],
  now: number = Date.now(),
): boolean => {
  const eventId = event._id;
  if (!eventId) return false;
  return claims.some((claim) => claim.eventId === eventId && claim.until > now);
};

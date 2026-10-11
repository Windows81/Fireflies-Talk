import { format } from "date-fns";
import type {
  CalendarEventNotificationPayload,
  NotificationActionPayload,
} from "electron/src/types";
import type { CalendarEvents } from "@/graphql";
import {
  getPlatformFromUrl,
  getPlatformIconKey,
} from "@/features/desktop-meeting-detection";
import type { UpcomingMeetingNotification } from "@/features/settings";

const LEAD_TIME_BY_SETTING: Record<UpcomingMeetingNotification, number | null> =
  {
    "10_minutes": 10 * 60 * 1000,
    "5_minutes": 5 * 60 * 1000,
    "2_minutes": 2 * 60 * 1000,
    on_event_time: 0,
    never: null,
  };

export interface CalendarEventNotificationIntent {
  eventId: string;
  startTime: number;
  payload: CalendarEventNotificationPayload;
}

export function getUpcomingMeetingLeadTime(
  setting: UpcomingMeetingNotification,
): number | null {
  return LEAD_TIME_BY_SETTING[setting];
}

function toJoinUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function buildTimeLabel(startDate: Date, endDate?: Date): string {
  if (endDate && !Number.isNaN(endDate.getTime())) {
    return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
  }
  return format(startDate, "h:mm a");
}

function buildCalendarActionUrl(
  mode: "join" | "join_invite",
  eventId: string,
  meetingUrl: string,
  platform?: string,
  displayName?: string,
): string {
  const params = new URLSearchParams({
    mode,
    eventId,
    url: meetingUrl,
  });

  if (platform) {
    params.set("platform", platform);
  }
  if (displayName) {
    params.set("displayName", displayName);
  }

  return `/calendar-event-action?${params.toString()}`;
}

function buildStartRecordingActionUrl(
  eventId: string,
  title?: string,
  iCalUID?: string,
  meetingUrl?: string,
  platform?: string,
  displayName?: string,
): string {
  const params = new URLSearchParams({
    source: "notification",
    trigger: "calendar_event",
    calendarEventId: eventId,
  });

  if (title) {
    params.set("title", title);
  }
  if (meetingUrl) {
    params.set("meetingUrl", meetingUrl);
    params.set("joinUrl", meetingUrl);
  }
  if (platform) {
    params.set("platform", platform);
  }
  if (displayName) {
    params.set("displayName", displayName);
  }
  if (iCalUID) {
    params.set("iCalUID", iCalUID);
  }

  return `/start-recording?${params.toString()}`;
}

function getEventId(event: CalendarEvents): string | null {
  return event._id || event.meetingId || event.iCalUID || null;
}

function getDisplayName(platform?: string): string | undefined {
  if (platform === "microsoft teams") {
    return "Teams";
  }
  if (platform === "gmeet") {
    return "Google Meet";
  }
  if (platform === "zoom") {
    return "Zoom";
  }
  return undefined;
}

function buildActions({
  autoStartNotes,
  displayName,
  eventId,
  hasAutoJoin,
  iCalUID,
  iconKey,
  meetingUrl,
  platform,
  title,
}: {
  autoStartNotes: boolean;
  displayName?: string;
  eventId: string;
  hasAutoJoin: boolean;
  iCalUID?: string;
  iconKey?: string;
  meetingUrl?: string;
  platform?: string;
  title?: string;
}): {
  primaryAction: NotificationActionPayload;
  menuAction?: NotificationActionPayload;
} | null {
  if (meetingUrl && hasAutoJoin) {
    return {
      primaryAction: {
        text: "Join Meeting",
        url: buildCalendarActionUrl(
          "join",
          eventId,
          meetingUrl,
          platform,
          displayName,
        ),
        icon: iconKey,
      },
    };
  }

  if (meetingUrl) {
    // When auto-start is on, notes are captured automatically — just join
    if (autoStartNotes) {
      return {
        primaryAction: {
          text: "Join Meeting",
          url: buildCalendarActionUrl(
            "join",
            eventId,
            meetingUrl,
            platform,
            displayName,
          ),
          icon: iconKey,
        },
      };
    }

    return {
      primaryAction: {
        text: "Join and Take Notes",
        url: buildStartRecordingActionUrl(
          eventId,
          title,
          iCalUID,
          meetingUrl,
          platform,
          displayName,
        ),
        icon: iconKey,
      },
      menuAction: {
        text: "Join and Invite Bot",
        url: buildCalendarActionUrl(
          "join_invite",
          eventId,
          meetingUrl,
          platform,
          displayName,
        ),
        icon: "plus",
      },
    };
  }

  // No meeting URL: auto-start will capture notes automatically, nothing actionable
  if (autoStartNotes) {
    return null;
  }

  return {
    primaryAction: {
      text: "Take Notes",
      url: buildStartRecordingActionUrl(eventId, title, iCalUID),
      icon: "mic",
    },
  };
}

export function buildCalendarEventNotificationIntent(
  event: CalendarEvents,
  autoStartNotes = false,
): CalendarEventNotificationIntent | null {
  const eventId = getEventId(event);
  if (!eventId || !event.date) {
    return null;
  }

  const startDate = new Date(event.date);
  const startTime = startDate.getTime();
  if (Number.isNaN(startTime)) {
    return null;
  }

  const rawUrl = event.url?.trim() || "";
  const meetingUrl = rawUrl ? toJoinUrl(rawUrl) : undefined;
  const platform = meetingUrl
    ? (getPlatformFromUrl(meetingUrl) ?? undefined)
    : undefined;
  const displayName = getDisplayName(platform);
  const iconKey = platform ? getPlatformIconKey(platform) : undefined;
  const iCalUID = event.iCalUID?.trim() || undefined;
  const title = event.title?.trim() || "Meeting";
  const actions = buildActions({
    autoStartNotes,
    displayName,
    eventId,
    hasAutoJoin: Boolean(event.fredAdded),
    iCalUID,
    iconKey,
    meetingUrl,
    platform,
    title,
  });
  if (!actions) return null;
  const { primaryAction, menuAction } = actions;

  const endDate = event.endDate ? new Date(event.endDate) : undefined;

  return {
    eventId,
    startTime,
    payload: {
      meetingName: title,
      eventId,
      timeLabel: buildTimeLabel(startDate, endDate),
      primaryAction,
      menuAction,
    },
  };
}

import { useEffect, useRef } from "react";
import type { CalendarEvents, MeetingStatusData } from "@/graphql";
import type {
  DesktopCalendarSyncState,
  TrayCalendarEvent,
  TrayLiveMeeting,
} from "electron/src/types";

const DEFAULT_EVENT_DURATION_MS = 3_600_000;

function buildEvents(
  events?: CalendarEvents[],
  meetingPrepEventIds?: Set<string> | null,
): TrayCalendarEvent[] {
  return (events ?? [])
    .filter(
      (e) => e.isValidMeeting !== false && !e.cancelReason && e.date && e.title,
    )
    .map((e) => ({
      id: e._id || e.iCalUID || e.meetingId || "",
      title: e.title!,
      startTime: new Date(e.date!).getTime(),
      endTime: e.endDate
        ? new Date(e.endDate).getTime()
        : new Date(e.date!).getTime() + DEFAULT_EVENT_DURATION_MS,
      fredAdded: Boolean(e.fredAdded),
      url: e.url,
      meetingId: e.meetingId,
      iCalUID: e.iCalUID,
      hasMeetingPrep:
        meetingPrepEventIds != null &&
        ((!!e._id && meetingPrepEventIds.has(e._id)) ||
          (!!e.meetingId && meetingPrepEventIds.has(e.meetingId))),
    }))
    .filter((e) => e.id);
}

function buildLiveMeetings(
  liveMeetings: MeetingStatusData[],
): TrayLiveMeeting[] {
  return liveMeetings
    .filter((m) => m.objectId && m.title)
    .map((m) => ({
      meetingId: m.objectId!,
      title: m.title!,
      url: m.url,
    }));
}

type UseSyncDesktopCalendarInput = {
  events?: CalendarEvents[];
  liveMeetings: MeetingStatusData[];
  hasUser: boolean;
  isLoadingEvents?: boolean;
  isLoadingUser: boolean;
  meetingPrepEventIds?: Set<string> | null;
};

/**
 * Single source of truth for pushing calendar + live-meeting state to the main
 * process. Both the tray menu and the auto-updater's restart-blocking logic are
 * fed by this one sync. Apollo polling hands back fresh array references on
 * every refetch even when the data is identical, so we diff the serialized
 * payload and only cross the IPC boundary on a real change — this keeps the
 * main-process logs quiet and the two consumers in lockstep.
 */
export function useSyncDesktopCalendar({
  events,
  liveMeetings,
  hasUser,
  isLoadingEvents,
  isLoadingUser,
  meetingPrepEventIds,
}: UseSyncDesktopCalendarInput): void {
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electron?.calendar) return;

    const state: DesktopCalendarSyncState = {
      events: buildEvents(events, meetingPrepEventIds),
      liveMeetings: buildLiveMeetings(liveMeetings),
      isLoadingEvents: isLoadingUser || (hasUser && Boolean(isLoadingEvents)),
    };

    const signature = JSON.stringify(state);
    if (signature === lastSyncedRef.current) return;
    lastSyncedRef.current = signature;

    void window.electron.calendar.sync(state);
  }, [
    events,
    liveMeetings,
    hasUser,
    isLoadingEvents,
    isLoadingUser,
    meetingPrepEventIds,
  ]);
}

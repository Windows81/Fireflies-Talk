import { useCallback } from "react";
import type { CalendarEvents } from "@/graphql";
import { useGetWelcomeMeetingsQuery } from "@/graphql";
import { useAuth } from "../auth";
import { useAppState } from "@/utils/app-state";
import { isDesktop } from "@/utils/device";
import { usePollingIntervals } from "@/features/polling-intervals";
import { liveMeetingsApi } from "@/features/live";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { getEventEndTime } from "./eventTiming";

export interface CalendarEventsProps {
  events: CalendarEvents[] | undefined;
  isLoadingEvents?: boolean;
  refetch: () => void;
  error?: Error;
}

// Module-level sticky cache: keeps events until their endDate passes so that
// a meeting which drops off the server's "upcoming" list (once it starts) is
// still available during the meeting window.
const stickyCache = new Map<string, CalendarEvents>();

function mergeStickyCache(incoming: CalendarEvents[]): CalendarEvents[] {
  const now = Date.now();

  for (const e of incoming) {
    const id = e._id ?? e.iCalUID ?? e.meetingId;
    if (id) stickyCache.set(id, e);
  }

  for (const [id, e] of stickyCache) {
    if (getEventEndTime(e) < now) stickyCache.delete(id);
  }

  return Array.from(stickyCache.values());
}

// Calendar data is per-user; drop it when the signed-in user changes.
useAuth.subscribe((state, prevState) => {
  if (prevState.user?.id !== state.user?.id) stickyCache.clear();
});

export const useUpcomingCalendarEvents = (): CalendarEventsProps => {
  const { user } = useAuth();
  const appState = useAppState();
  const { calendarEventsMobile, calendarEventsDesktop } = usePollingIntervals();

  const skip = !user || (appState !== "active" && !isDesktop);
  const pollInterval = isDesktop ? calendarEventsDesktop : calendarEventsMobile;

  const {
    data,
    loading,
    refetch: refetchCalendarEvents,
    error,
  } = useGetWelcomeMeetingsQuery({
    skip,
    notifyOnNetworkStatusChange: true,
    pollInterval: skip ? 0 : pollInterval,
    fetchPolicy: "cache-and-network",
  });

  const isLoadingEvents = loading || skip;

  const incoming = data?.getCalendarEvents?.events as
    | CalendarEvents[]
    | undefined;

  const events = incoming ? mergeStickyCache(incoming) : undefined;

  const refetch = useCallback(() => {
    void Promise.allSettled([
      refetchCalendarEvents(),
      liveMeetingsApi.refetch(),
    ]);
  }, [refetchCalendarEvents]);

  useWindowFocus(refetch, { throttleMs: 30_000 });

  return {
    events,
    isLoadingEvents,
    refetch,
    error,
  };
};

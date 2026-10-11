import { useEffect, useRef, useCallback } from "react";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import type { MeetingStatusData } from "@/graphql";
import { useAuth } from "@/features/auth";
import { isDesktop } from "@/utils/device";
import { useAppState } from "@/utils/app-state";
import { usePollingIntervals } from "@/features/polling-intervals";
import type { CalendarEventsProps } from "@/features/calendar";
import { useLiveMeetingsStore, liveMeetingsApi } from "./live-meetings.store";

const LATE_REFETCH_DELAY_MS = 5 * 60 * 1000;

export interface UseLiveMeetingsResult {
  liveMeetings: MeetingStatusData[];
  isLoading: boolean;
  refetch: () => void;
}

export interface UseLiveMeetingsOptions {
  calendarEventProps?: CalendarEventsProps;
}

export const useLiveMeetings = (
  options?: UseLiveMeetingsOptions,
): UseLiveMeetingsResult => {
  const { user } = useAuth();
  const appState = useAppState();
  const {
    liveMeetingsMobile: mobilePollInterval,
    liveMeetingsDesktop: desktopPollInterval,
  } = usePollingIntervals();
  const calendarEvents = options?.calendarEventProps?.events;

  const liveMeetings = useLiveMeetingsStore((s) => s.meetings);
  const storeLoading = useLiveMeetingsStore((s) => s.loading);

  const skip = !user || (appState !== "active" && !isDesktop);
  const basePollInterval = isDesktop ? desktopPollInterval : mobilePollInterval;
  const pollInterval = skip ? 0 : basePollInterval;

  // Ref-counted poll subscription. Re-acquire when interval/skip changes.
  useEffect(() => {
    const release = liveMeetingsApi.acquirePoll({ pollInterval, skip });
    return release;
  }, [pollInterval, skip]);

  useWindowFocus(() => void liveMeetingsApi.refetch(), { throttleMs: 10000 });

  // Calendar late-refetch fallback: 5 min after a calendar event start, if the
  // meeting still is not in the live list, do a one-off refetch. Guarding on
  // list membership subsumes the old "sse received" guard (SSE triggers a
  // refetch, so an arrived meeting is already in the list).
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const firedRef = useRef<Set<string>>(new Set());

  const isInList = useCallback(
    (meetingId: string) =>
      useLiveMeetingsStore
        .getState()
        .meetings.some((m) => m?.objectId === meetingId),
    [],
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    const seen = new Set<string>();

    if (!calendarEvents || calendarEvents.length === 0) {
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
      firedRef.current.clear();
      return;
    }

    // Events already overdue at this pass are coalesced into a single refetch
    // below; only future events get their own (naturally time-spread) timer.
    let hasOverdueRefetch = false;

    calendarEvents.forEach((event) => {
      const meetingId = event?.meetingId ?? null;
      if (!meetingId || !event?.date) return;
      seen.add(meetingId);
      if (
        isInList(meetingId) ||
        timeouts.has(meetingId) ||
        firedRef.current.has(meetingId)
      ) {
        return;
      }
      const start = new Date(event.date).getTime();
      if (Number.isNaN(start)) return;
      const triggerAt = start + LATE_REFETCH_DELAY_MS;
      const delay = triggerAt - Date.now();
      if (delay <= 0) {
        firedRef.current.add(meetingId);
        if (!isInList(meetingId)) hasOverdueRefetch = true;
        return;
      }
      timeouts.set(
        meetingId,
        setTimeout(() => {
          timeouts.delete(meetingId);
          firedRef.current.add(meetingId);
          if (!isInList(meetingId)) void liveMeetingsApi.refetch();
        }, delay),
      );
    });

    if (hasOverdueRefetch) void liveMeetingsApi.refetch();

    Array.from(timeouts.entries()).forEach(([meetingId, t]) => {
      if (!seen.has(meetingId)) {
        clearTimeout(t);
        timeouts.delete(meetingId);
      }
    });

    // Drop fired markers for events that are gone, so a reappearing event can
    // schedule a fresh late-refetch instead of being suppressed forever.
    firedRef.current.forEach((id) => {
      if (!seen.has(id)) firedRef.current.delete(id);
    });
  }, [calendarEvents, isInList]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, []);

  return {
    liveMeetings,
    isLoading: storeLoading || skip,
    refetch: liveMeetingsApi.refetch,
  };
};

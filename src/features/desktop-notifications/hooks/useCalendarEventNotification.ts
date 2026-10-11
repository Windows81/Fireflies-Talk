import { useEffect, useRef } from "react";
import type { CalendarEvents } from "@/graphql";
import { useLocalSettings } from "@/features/settings";
import { Logger } from "@/logger";
import { showCalendarEventNotification } from "../utils";
import {
  buildCalendarEventNotificationIntent,
  getUpcomingMeetingLeadTime,
} from "../calendarEventNotificationPolicy";

const logger = new Logger("useCalendarEventNotification");

const MAX_SCHEDULE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const useCalendarEventNotification = (
  events: CalendarEvents[] | undefined,
) => {
  const { upcomingMeetingNotification } = useLocalSettings();
  const notifiedEventKeysRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts.clear();

    const leadTimeMs = getUpcomingMeetingLeadTime(upcomingMeetingNotification);
    if (leadTimeMs === null || !events?.length) {
      return;
    }

    const now = Date.now();

    events.forEach((event) => {
      const intent = buildCalendarEventNotificationIntent(event);
      if (!intent) {
        return;
      }

      const notificationAt = intent.startTime - leadTimeMs;
      const timeUntilNotification = notificationAt - now;

      if (
        timeUntilNotification < 0 ||
        timeUntilNotification > MAX_SCHEDULE_WINDOW_MS
      ) {
        return;
      }

      const eventKey = `${intent.eventId}:${intent.startTime}`;
      if (notifiedEventKeysRef.current.has(eventKey)) {
        return;
      }

      const timeout = setTimeout(async () => {
        const state = useLocalSettings.getState();
        if (state.upcomingMeetingNotification === "never") {
          return;
        }

        // Re-build with current autoStartNotes so the action reflects live setting
        const currentIntent = buildCalendarEventNotificationIntent(
          event,
          state.autoStartNotes,
        );
        if (!currentIntent) return;

        try {
          const shown = await showCalendarEventNotification(
            currentIntent.payload,
          );
          if (shown) {
            notifiedEventKeysRef.current.add(eventKey);
          }
        } catch (error) {
          logger.error(
            "[CALENDAR_EVENT_NOTIFICATION] Failed to show notification",
            {
              eventId: intent.eventId,
              error,
            },
          );
        } finally {
          timeoutsRef.current.delete(eventKey);
        }
      }, timeUntilNotification);

      timeouts.set(eventKey, timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [events, upcomingMeetingNotification]);
};

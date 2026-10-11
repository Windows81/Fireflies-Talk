import { useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import type { ListMeetingPrepsQuery } from "@firefliesai/ai-apps-service.graphql-client";
import type { CalendarEvents } from "@/graphql";
import { useLocalSettings } from "@/features/settings";
import { Logger } from "@/logger";
import {
  buildMeetingPrepEventIdSet,
  ListMeetingPrepsDocument,
} from "@/hooks/useListMeetingPreps";
import { showUpcomingMeetingNotification } from "../utils";

const logger = new Logger("useMeetingPrepNotification");

const NOTIFICATION_TIME_BEFORE_MEETING = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useMeetingPrepNotification = (
  events: CalendarEvents[] | undefined,
) => {
  const { meetingPrepNotification } = useLocalSettings();
  const apolloClient = useApolloClient();
  const notifiedEventsRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Copy ref to local variable for cleanup function
    const timeouts = timeoutsRef.current;

    // Clear all existing timeouts
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts.clear();

    if (!meetingPrepNotification || !events) {
      return;
    }

    const now = Date.now();

    events.forEach((event) => {
      // Skip events without required fields
      if (!event.date || !event._id) {
        return;
      }

      const hasAutoJoin =
        !!event.fredAdded &&
        !!event.userCanToggle &&
        Boolean(event.isOrganizer);

      const hasMeetingId = !!event.meetingId;

      // Skip if neither meeting prep candidate nor auto-join is available
      if (!hasMeetingId && !hasAutoJoin) {
        return;
      }

      const eventId = event._id;
      const eventStartTime = new Date(event.date).getTime();
      const notificationTime =
        eventStartTime - NOTIFICATION_TIME_BEFORE_MEETING;
      const timeUntilNotification = notificationTime - now;

      // Skip if already notified
      if (notifiedEventsRef.current.has(eventId)) {
        return;
      }

      // Skip if notification time has already passed
      if (timeUntilNotification < 0) {
        return;
      }

      // Skip if event is more than 24 hours away (to avoid too many timers)
      if (timeUntilNotification > 24 * 60 * 60 * 1000) {
        return;
      }

      // Schedule notification
      const timeout = setTimeout(async () => {
        // Double-check the setting is still enabled
        const currentSettings = useLocalSettings.getState();
        if (!currentSettings.meetingPrepNotification) {
          return;
        }

        // Fetch the list of calendar event IDs that have meeting prep
        let hasMeetingPrep = false;
        try {
          const { data } = await apolloClient.query<ListMeetingPrepsQuery>({
            query: ListMeetingPrepsDocument,
            fetchPolicy: "network-only",
          });
          const ids = buildMeetingPrepEventIdSet(data);
          hasMeetingPrep =
            (!!event._id && ids.has(event._id)) ||
            ids.has(event.meetingId as string);
        } catch {
          // Query failed — skip meeting prep for this notification
        }

        const meetingName = event.title || "Upcoming Meeting";
        const prepUrl = hasMeetingPrep
          ? `/meeting-prep?eventId=${eventId}`
          : undefined;

        showUpcomingMeetingNotification({
          meetingName,
          eventId,
          iCalUID: event.iCalUID || undefined,
          calendarType: event.calendarType || undefined,
          hasMeetingPrep,
          hasAutoJoin,
          prepUrl,
        })
          .then((success) => {
            if (success) {
              notifiedEventsRef.current.add(eventId);
            }
          })
          .catch((error) => {
            logger.error(
              `[MEETING_PREP_NOTIFICATION] Error showing notification (eventId=${eventId}, inMs=${timeUntilNotification})`,
              error,
            );
          });

        // Clean up this timeout from the map
        timeoutsRef.current.delete(eventId);
      }, timeUntilNotification);

      timeouts.set(eventId, timeout);
    });

    // Cleanup function - use local variable copy
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [events, meetingPrepNotification, apolloClient]);

  // Cleanup on unmount
  useEffect(() => {
    // Copy ref to local variable for cleanup function
    const timeouts = timeoutsRef.current;

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);
};

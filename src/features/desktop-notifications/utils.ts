/**
 * Utility functions for desktop notifications in Electron environment
 */

import { Logger } from "@/logger";
import { getLocalSettings } from "@/features/settings";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type {
  CalendarEventNotificationPayload,
  MeetingNotificationPayload,
  NotificationConfig,
  UpcomingMeetingNotificationPayload,
} from "electron/src/types";

const logger = new Logger("desktop-notifications");

const PERSISTENT_CONFIG: NotificationConfig = {
  timeout: 0,
  showProgress: false,
  showCloseAlways: true,
};

function getPersistenceConfig(): NotificationConfig | undefined {
  return getLocalSettings().notificationPersistence === "persistent"
    ? PERSISTENT_CONFIG
    : undefined;
}

/**
 * Notification types for tracking purposes
 */
export type DesktopNotificationType =
  | "add_to_live"
  | "live_assist"
  | "meeting_prep"
  | "system_audio"
  | "auto_join_skip"
  | "daily_brief"
  | "calendar_event";

/**
 * Show a desktop notification using Electron's custom notification window
 */
export async function showDesktopNotification(
  title: string,
  body: string,
  actionUrl: string,
  actionText: string,
  notificationType: DesktopNotificationType,
): Promise<boolean> {
  if (!window?.electron?.notification) {
    logger.info("Skipping desktop notification: not running in Electron", {
      notificationType,
      title,
      actionUrl,
    });
    return false;
  }

  try {
    const result = await window.electron.notification.show(
      title,
      body,
      actionUrl,
      actionText,
    );

    if (result) {
      tracker.track(TRACKING_EVENTS.DESKTOP_NOTIFICATION_SHOWN, {
        notificationType,
      });
    } else {
      logger.info("Desktop notification not shown (IPC returned false)", {
        notificationType,
        title,
        actionUrl,
      });
    }

    return Boolean(result);
  } catch (error) {
    logger.error("[NOTIFICATION] Failed to show desktop notification:", error);
    return false;
  }
}

/**
 * Show a desktop meeting notification with multi-action buttons.
 */
export async function showMeetingNotification(
  payload: MeetingNotificationPayload,
  notificationType: DesktopNotificationType = "system_audio",
): Promise<boolean> {
  if (!window?.electron?.notification) {
    logger.info("Skipping meeting desktop notification: not in Electron", {
      notificationType,
      title: payload.title,
      actionUrl: payload.primaryAction.url,
    });
    return false;
  }

  try {
    const result = await window.electron.notification.showMeeting({
      ...payload,
      notificationConfig: payload.notificationConfig ?? getPersistenceConfig(),
    });

    if (result) {
      tracker.track(TRACKING_EVENTS.DESKTOP_NOTIFICATION_SHOWN, {
        notificationType,
      });
    } else {
      logger.info(
        "Meeting desktop notification not shown (IPC returned false)",
        {
          notificationType,
          title: payload.title,
          actionUrl: payload.primaryAction.url,
        },
      );
    }

    return Boolean(result);
  } catch (error) {
    logger.error(
      "[NOTIFICATION] Failed to show meeting desktop notification:",
      error,
    );
    return false;
  }
}

/**
 * Show an upcoming meeting notification with meeting prep and/or auto-join info.
 */
export async function showUpcomingMeetingNotification(
  payload: UpcomingMeetingNotificationPayload,
): Promise<boolean> {
  // Nothing to show if neither meeting prep nor auto-join is available
  if (!payload.hasMeetingPrep && !payload.hasAutoJoin) {
    logger.info(
      "Skipping upcoming meeting notification: no meeting prep or auto-join",
      {
        eventId: payload.eventId,
      },
    );
    return false;
  }

  if (!window?.electron?.notification) {
    logger.info("Skipping upcoming meeting notification: not in Electron", {
      eventId: payload.eventId,
    });
    return false;
  }

  try {
    const result = await window.electron.notification.showUpcoming({
      ...payload,
      notificationConfig: payload.notificationConfig ?? getPersistenceConfig(),
    });

    if (result) {
      tracker.track(TRACKING_EVENTS.DESKTOP_NOTIFICATION_SHOWN, {
        notificationType: "meeting_prep" satisfies DesktopNotificationType,
      });
    } else {
      logger.info(
        "Upcoming meeting notification not shown (IPC returned false)",
        {
          eventId: payload.eventId,
        },
      );
    }

    return Boolean(result);
  } catch (error) {
    logger.error(
      "[NOTIFICATION] Failed to show upcoming meeting notification:",
      error,
    );
    return false;
  }
}

/**
 * Show a desktop calendar event notification with contextual actions.
 */
export async function showCalendarEventNotification(
  payload: CalendarEventNotificationPayload,
): Promise<boolean> {
  if (!window?.electron?.notification) {
    logger.info("Skipping calendar event notification: not in Electron", {
      eventId: payload.eventId,
    });
    return false;
  }

  try {
    const result = await window.electron.notification.showCalendarEvent({
      ...payload,
      notificationConfig: payload.notificationConfig ?? getPersistenceConfig(),
    });

    if (result) {
      tracker.track(TRACKING_EVENTS.DESKTOP_NOTIFICATION_SHOWN, {
        notificationType: "calendar_event" satisfies DesktopNotificationType,
      });
    } else {
      logger.info(
        "Calendar event notification not shown (IPC returned false)",
        {
          eventId: payload.eventId,
        },
      );
    }

    return Boolean(result);
  } catch (error) {
    logger.error(
      "[NOTIFICATION] Failed to show calendar event notification:",
      error,
    );
    return false;
  }
}

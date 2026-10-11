// Main manager hook
export { useDesktopNotificationManager } from "./useDesktopNotificationManager";

// Utility functions
export {
  showDesktopNotification,
  showMeetingNotification,
  type DesktopNotificationType,
} from "./utils";

// Notification hooks
export { useMeetingPrepNotification } from "./hooks/useMeetingPrepNotification";
export { useCalendarEventNotification } from "./hooks/useCalendarEventNotification";
export {
  initDailyBriefNotifications,
  disposeDailyBriefNotifications,
} from "./dailyBriefNotificationStore";

// Browser meetings
export { DesktopInviteFredModal } from "./browser-meetings/DesktopInviteFredModal";

export { useRealtimeNotifications } from "./useRealtimeNotifications";
export type { UseRealtimeNotificationsOptions } from "./useRealtimeNotifications";

// Live meeting notifier (desktop-only: notification dedup + self-start window)
export { useLiveMeetingNotifier } from "./live-meeting-notifier";
export { liveMeetingNotifier } from "./live-meeting-notifier-state";

export type UpcomingMeetingNotification =
  | "10_minutes"
  | "5_minutes"
  | "2_minutes"
  | "on_event_time"
  | "never";

const UPCOMING_MEETING_NOTIFICATION_VALUES =
  new Set<UpcomingMeetingNotification>([
    "10_minutes",
    "5_minutes",
    "2_minutes",
    "on_event_time",
    "never",
  ]);

export const normalizeUpcomingMeetingNotification = (
  value: unknown,
): UpcomingMeetingNotification => {
  if (value === true) {
    return "2_minutes";
  }
  if (value === false) {
    return "never";
  }
  if (
    typeof value === "string" &&
    UPCOMING_MEETING_NOTIFICATION_VALUES.has(
      value as UpcomingMeetingNotification,
    )
  ) {
    return value as UpcomingMeetingNotification;
  }
  return "2_minutes";
};

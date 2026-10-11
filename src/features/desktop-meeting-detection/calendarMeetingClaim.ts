import type { RecordingSource } from "@/features/live-record/types";
import { meetingDetectionApi } from "./store";

const CALENDAR_MEETING_CLAIM_MS = 5 * 60 * 1000;

function getClaimUntil(): number {
  return Date.now() + CALENDAR_MEETING_CLAIM_MS;
}

export function claimCalendarMeetingFromNotificationAction(
  url: URL,
  meetingUrl?: string,
): void {
  const eventId =
    url.searchParams.get("eventId") || url.searchParams.get("calendarEventId");
  if (!eventId) {
    return;
  }

  meetingDetectionApi.claimCalendarMeeting({
    eventId,
    url: meetingUrl || url.searchParams.get("url") || undefined,
    platform: url.searchParams.get("platform") || undefined,
    until: getClaimUntil(),
  });
}

export function claimCalendarMeetingFromRecordingSource(
  recordingSource: RecordingSource,
): void {
  if (!recordingSource.calendarEventId) {
    return;
  }

  meetingDetectionApi.claimCalendarMeeting({
    eventId: recordingSource.calendarEventId,
    url: recordingSource.joinUrl || recordingSource.meetingUrl,
    platform: recordingSource.platform,
    until: getClaimUntil(),
  });
}

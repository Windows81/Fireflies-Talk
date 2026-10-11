import { useEffect } from "react";
import { useLocalSettings } from "@/features/settings";
import {
  findCalendarTitleForDetectedMeeting,
  meetingDetectionApi,
} from "@/features/desktop-meeting-detection";
import { registerAutoStartNotesHandler } from "@/features/desktop-meeting-detection/store";
import type { MeetingEvent } from "@/features/desktop-meeting-detection/types";
import type { StartInputs } from "./RecordActionsContext";
import { useRecorder } from "./record.store";

/**
 * When autoStartNotes is enabled, registers a handler that immediately starts
 * recording when a meeting mic event is detected, skipping the notification.
 * Must be called from within RecordActionsContextProvider.
 */
export function useAutoStartNotesOnMicDetection(
  startRecording: (inputs?: StartInputs) => Promise<void>,
  startInputs: StartInputs,
): void {
  const autoStartNotes = useLocalSettings((s) => s.autoStartNotes);

  useEffect(() => {
    if (!autoStartNotes) {
      registerAutoStartNotesHandler(null);
      return;
    }

    const handler = (event: MeetingEvent) => {
      const { status } = useRecorder.getState();
      if (status.state !== "inactive") return;

      startRecording({
        ...startInputs,
        title:
          findCalendarTitleForDetectedMeeting(
            meetingDetectionApi.getState().calendarEvents,
            {
              url: event.originalUrl,
              platform: event.platform,
              urlFromCalendar: event.urlFromCalendar,
            },
          ) ||
          event.displayName ||
          startInputs.title,
        recordingSource: {
          type: "notification",
          processId: event.processId,
          processName: event.processName,
          parentProcessName: event.parentProcessName,
          parentProcessId: event.parentProcessId,
          platform: event.platform,
          displayName: event.displayName,
          meetingUrl: event.originalUrl,
        },
      });
    };

    registerAutoStartNotesHandler(handler);
    return () => registerAutoStartNotesHandler(null);
  }, [autoStartNotes, startRecording, startInputs]);
}

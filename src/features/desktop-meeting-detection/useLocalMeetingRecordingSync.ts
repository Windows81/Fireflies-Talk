import { useEffect, useRef } from "react";
import { useRecorder } from "@/features/live-record/record.store";
import { meetingDetectionApi } from "./store";

export const useLocalMeetingRecordingSync = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const context = useRecorder((s) => s.context);
  const syncedRecordingRef = useRef(false);
  const manualRecordIdRef = useRef<string | null>(null);

  useEffect(() => {
    const recordingSource = context?.recordingSource;
    const processId = recordingSource?.processId;
    const sourceType = recordingSource?.type;

    if (recordingState !== "inactive" && !syncedRecordingRef.current) {
      if (!recordingSource || !sourceType) {
        return;
      }
      const isManualSource = sourceType === "tray" || sourceType === "manual";

      if (!isManualSource) {
        meetingDetectionApi.markLocalMeetingRecording(
          recordingSource,
          context?.meetingId,
        );
      } else {
        const manualEvent = {
          type: "audio" as const,
          platform: "system-audio",
          displayName: "System audio",
          timestamp: Date.now(),
        };
        meetingDetectionApi.upsertLocalMeeting(manualEvent);
        const manualRecord = meetingDetectionApi
          .getState()
          .localMeetings.find(
            (item) => item.event.platform === manualEvent.platform,
          );
        if (manualRecord) {
          meetingDetectionApi.setLocalMeetingStatus(
            manualRecord.id,
            "recording",
            {
              recordingMeetingId: context?.meetingId,
            },
          );
          manualRecordIdRef.current = manualRecord.id;
        }
      }
      syncedRecordingRef.current = true;
    }

    if (recordingState === "inactive" && syncedRecordingRef.current) {
      if (processId) {
        meetingDetectionApi.markLocalMeetingEndedByProcess(
          processId,
          "recording",
        );
      }
      if (manualRecordIdRef.current) {
        meetingDetectionApi.markLocalMeetingEndedById(
          manualRecordIdRef.current,
          "recording",
        );
      }
      manualRecordIdRef.current = null;
      syncedRecordingRef.current = false;
    }
  }, [
    recordingState,
    context?.meetingId,
    context?.recordingSource,
    context?.recordingSource?.processId,
    context?.recordingSource?.type,
  ]);
};

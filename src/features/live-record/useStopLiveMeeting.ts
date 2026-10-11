import { toast } from "@/components/Toast";
import { meetingEndAnimationApi } from "@/features/meeting-end-animation";
import { useCallback, useState } from "react";
import { stopRealtimeMeeting } from "./puppet-sync";
import {
  STOP_DESKTOP_RECORDING_FAILED_MESSAGE,
  isDesktopRecording,
  stopLiveMeeting,
} from "./stop-live-meeting";

interface UseStopLiveMeetingOptions {
  meetingId: string;
  addedBy?: string | null;
  endPuppetCall: () => Promise<unknown>;
  onStopped?: () => Promise<void> | void;
}

export function useStopLiveMeeting({
  meetingId,
  addedBy,
  endPuppetCall,
  onStopped,
}: UseStopLiveMeetingOptions) {
  const [isStopping, setIsStopping] = useState(false);
  const [hasStopped, setHasStopped] = useState(false);

  const stop = useCallback(() => {
    meetingEndAnimationApi.show(meetingId, async () => {
      if (!isDesktopRecording(addedBy)) {
        await endPuppetCall();
        return;
      }

      setIsStopping(true);
      try {
        await stopLiveMeeting({
          meetingId,
          addedBy,
          stopRealtime: stopRealtimeMeeting,
          endPuppetCall,
        });
        setHasStopped(true);
        toast({
          message: "Successfully ended the meeting",
          type: "success",
        });
        await onStopped?.();
      } catch (error) {
        meetingEndAnimationApi.clearCompleted(meetingId);
        toast({
          title: "Failed to end the meeting",
          message:
            error instanceof Error
              ? error.message
              : STOP_DESKTOP_RECORDING_FAILED_MESSAGE,
          type: "error",
        });
      } finally {
        setIsStopping(false);
      }
    });
  }, [addedBy, endPuppetCall, meetingId, onStopped]);

  return { stop, isStopping, hasStopped };
}

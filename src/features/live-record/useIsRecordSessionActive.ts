import { usePhoneCall } from "@/features/phone-call";
import { isRecordSessionActive } from "./record-session";
import { useRecordPhase } from "./record-phase.store";
import { useRecorder } from "./record.store";

/**
 * Single source of truth for "a capture session is on screen", shared by the
 * recorder's floating card and any overlay that must not sit on top of it.
 */
export const useIsRecordSessionActive = (): boolean => {
  const phoneCallState = usePhoneCall((state) => state.status.state);
  const recordingState = useRecorder((state) => state.status.state);
  const streamingState = useRecorder((state) => state.status.streamingState);
  const streamingError = useRecorder((state) => state.status.streamingError);
  const recordPhase = useRecordPhase();

  return isRecordSessionActive({
    phoneCallState,
    recordingState,
    streamingState,
    streamingError,
    recordPhase,
  });
};

import type { PhoneCallStates } from "@/features/phone-call/types";
import type { RecordPhase } from "./record-phase.store";
import type { RecordingStates } from "./types";

export interface RecordSessionSnapshot {
  phoneCallState: PhoneCallStates["state"];
  recordingState: RecordingStates["state"];
  streamingState: RecordingStates["streamingState"];
  streamingError: RecordingStates["streamingError"];
  recordPhase: RecordPhase;
}

/**
 * Whether a capture session owns the bottom of the screen: a phone call, a
 * local recording, a stream (or its failure), or a start/stop transition.
 *
 * The phase check keeps the session open across start and stop, when the
 * recorder itself momentarily reads "inactive".
 */
export const isRecordSessionActive = ({
  phoneCallState,
  recordingState,
  streamingState,
  streamingError,
  recordPhase,
}: RecordSessionSnapshot): boolean =>
  phoneCallState !== "inactive" ||
  recordingState !== "inactive" ||
  streamingState !== "inactive" ||
  !!streamingError ||
  recordPhase !== "idle";

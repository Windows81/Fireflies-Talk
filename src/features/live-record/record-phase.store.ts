import { create } from "zustand";
import { useRecorder } from "./record.store";

/**
 * Where the recorder is in its lifecycle, as one value any screen can read.
 *
 * Only the two in-flight transitions are stored; "recording" is derived from
 * the recorder itself. Storing it would leave the phase stuck at "recording"
 * on every exit that isn't stopRecording() — discard, the max-duration
 * auto-stop, the error listener — and the floating card would never leave.
 * A paused recording is still "recording": the session is open either way.
 */
export type RecordPhase = "idle" | "starting" | "recording" | "ending";

export const RECORD_STARTING_LABEL = "Starting notes...";

type Transition = "starting" | "ending" | null;

const useRecordTransition = create<{ transition: Transition }>(() => ({
  transition: null,
}));

const toPhase = (transition: Transition, isCapturing: boolean): RecordPhase =>
  transition ?? (isCapturing ? "recording" : "idle");

export const useRecordPhase = (): RecordPhase => {
  const transition = useRecordTransition((s) => s.transition);
  const state = useRecorder((s) => s.status.state);
  return toPhase(transition, state !== "inactive");
};

export const isTransitionalPhase = (phase: RecordPhase) =>
  phase === "starting" || phase === "ending";

export const recordPhaseApi = {
  beginTransition: (transition: "starting" | "ending") =>
    useRecordTransition.setState({ transition }),
  endTransition: () => useRecordTransition.setState({ transition: null }),
  isBusy: () => useRecordTransition.getState().transition !== null,
  isRecording: () =>
    toPhase(
      useRecordTransition.getState().transition,
      useRecorder.getState().status.state !== "inactive",
    ) === "recording",
};

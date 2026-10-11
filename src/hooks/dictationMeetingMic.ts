import type { DictationState } from "electron/src/types";

/**
 * A meeting recording running alongside Talk must not pick up what the user
 * dictates. The microphone is theirs for exactly the span the pill shows as
 * recording: from reveal until the capture stops for processing or is
 * cancelled. Everything else the meeting hears — system audio, the mic before
 * and after — is untouched.
 */
export function meetingMicMutedDuringDictation(state: DictationState): boolean {
  return state === "recording";
}

/** Pushes the mute flag only on transitions, so idle→idle churn stays silent. */
export function createMeetingMicSync(
  setMicrophoneMuted: (muted: boolean) => void,
): (state: DictationState) => void {
  let muted = false;
  return (state) => {
    const next = meetingMicMutedDuringDictation(state);
    if (next === muted) return;
    muted = next;
    setMicrophoneMuted(next);
  };
}

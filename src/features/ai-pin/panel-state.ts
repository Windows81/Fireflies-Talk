export type AiPinSheetMode =
  | "hidden"
  | "detected"
  | "connecting"
  | "connected"
  | "recording"
  | "details"
  | "error";

export function modeAfterRecordingEvent(
  current: AiPinSheetMode,
  active: boolean,
): AiPinSheetMode {
  if (current === "details" && active) return "recording";
  if (current === "recording" && !active) return "details";
  return current;
}

export const recordingJustStopped = (wasActive: boolean, active: boolean) =>
  wasActive && !active;

export function formatRecordingDuration(durationMillis: number) {
  const totalSeconds = Math.ceil(Math.max(0, durationMillis) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

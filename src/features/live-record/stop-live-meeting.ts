import { UPLOAD_CLIENT_KEYS } from "@/features/upload/constants";

interface StopLiveMeetingOptions {
  meetingId: string;
  addedBy?: string | null;
  stopRealtime: (options: {
    meetingId: string;
    completed: true;
  }) => Promise<boolean>;
  endPuppetCall: () => Promise<unknown>;
}

export const STOP_DESKTOP_RECORDING_FAILED_MESSAGE =
  "Could not stop the recording. Check your connection and try again.";

export function isDesktopRecording(addedBy?: string | null): boolean {
  return addedBy === UPLOAD_CLIENT_KEYS.DESKTOP_RECORD;
}

/**
 * End a live meeting from the UI when the local recorder is not driving it.
 * Desktop recordings have no puppet pod, so the puppet end call can never end
 * them; they end through the realtime stop mutation instead. Throws when the
 * realtime stop fails so callers keep the control usable for a retry.
 */
export async function stopLiveMeeting({
  meetingId,
  addedBy,
  stopRealtime,
  endPuppetCall,
}: StopLiveMeetingOptions): Promise<void> {
  if (!isDesktopRecording(addedBy)) {
    await endPuppetCall();
    return;
  }

  const stopped = await stopRealtime({ meetingId, completed: true });
  if (!stopped) throw new Error(STOP_DESKTOP_RECORDING_FAILED_MESSAGE);
}

import * as AudioRecord from "@/modules/audio-record";
import { useEffect } from "react";
import { describeCameraNotice } from "./camera-recording-policy";
import { useCameraRecordingPolicy } from "./camera-policy.store";
import { useRecorder } from "./record.store";

/**
 * Reports the camera-notice verdict to the running recorder.
 *
 * Mounted once, in the window that owns the recording. The Live views read the
 * same verdict to show the warning, but only this hook reaches the recorder —
 * so the state that ends up in the heartbeat is recorded exactly once, by the
 * process that actually holds the audio graph.
 */
export function useCameraRecordingEnforcement(): void {
  const policy = useCameraRecordingPolicy();
  const recordingState = useRecorder((state) => state.status.state);
  const isRecordingHere = recordingState !== "inactive";

  useEffect(() => {
    // Outside a recording there is nothing to report, and a verdict left set
    // would carry into the next recording before its own is known.
    const missing = isRecordingHere && policy.noticeMissing;

    AudioRecord.setCameraNotice({
      missing,
      detail: describeCameraNotice(policy),
      silenceAudio: missing && policy.silenceAudio,
    });
  }, [policy, isRecordingHere]);
}

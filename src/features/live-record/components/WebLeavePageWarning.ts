import { type FC, useEffect } from "react";
import { useRecorder } from "../record.store";
import { Platform } from "react-native";

export const WebLeavePageWarning: FC = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const streamingState = useRecorder((s) => s.status.streamingState);
  const streamingError = useRecorder((s) => s.status.streamingError);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Show leave-page warning if recording is active,
      // streaming is active, or there's a streaming error
      if (
        recordingState !== "inactive" ||
        streamingState !== "inactive" ||
        streamingError !== null
      ) {
        event.preventDefault(); // for Firefox
        event.returnValue = ""; // for Chrome
        return "";
      }
      return false;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [recordingState, streamingState, streamingError]);

  return null;
};

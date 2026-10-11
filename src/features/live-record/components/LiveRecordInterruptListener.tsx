import { toast } from "@/components/Toast";
import { Logger } from "@/logger";
import type { ErrorEvent } from "@/modules/audio-record";
import { scheduleNotificationAsync } from "@/utils/notifications";
import { useBooleanState } from "@/utils/states";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { recorderApi, useRecorder } from "../record.store";
import { SilentRecordingDialog } from "./SilentRecordingDialog";

const TIMEOUT_MS = 10 * 1000;

const logger = new Logger("live-record-interrupt-listener");

// check if the recording is silent for 30 seconds
// straight and show actionable message to user
export const useIsRecordingSilent = ({
  onDetectedSilence,
}: {
  onDetectedSilence: () => void;
}) => {
  const recordingState = useRecorder((state) => state.status.state);
  const prevStatusRef = useRef(recordingState);

  const stableOnDetectedSilence = useEffectEvent(onDetectedSilence);

  const hasShownSilenceMessage = useRef(false);

  useEffect(() => {
    if (
      prevStatusRef.current === "recording" &&
      recordingState === "inactive"
    ) {
      // new recording started
      hasShownSilenceMessage.current = false;
    }
    prevStatusRef.current = recordingState;
  }, [recordingState]);

  const [isSilent, setIsSilent] = useState(false);

  useEffect(() => {
    if (isSilent) {
      const timeout = setTimeout(() => {
        if (hasShownSilenceMessage.current) return;
        logger.info(`silence detected after ${TIMEOUT_MS}ms`);
        hasShownSilenceMessage.current = true;
        stableOnDetectedSilence();
      }, TIMEOUT_MS);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isSilent]);

  useEffect(() => {
    if (recordingState !== "recording") return setIsSilent(false);
    const subscription = recorderApi.addEventListener("status", (event) => {
      // event.metering is a value between -160 and 0
      // show message if this keeps happening for x seconds
      if (!event.metering) return;
      setIsSilent(event.metering <= -160);
    });
    return subscription.remove;
  }, [recordingState]);

  return isSilent;
};

const showNotificationOnSilence = () => {
  scheduleNotificationAsync({
    content: {
      title: "Your recording has no sound",
      body: "Please check that your microphone is working and no other apps are using it.",
    },
    trigger: null,
    identifier: "live-record/recording",
  });
};

const showNotificationOnInterrupt = () => {
  scheduleNotificationAsync({
    content: {
      title: "Your recording was interrupted",
      body: "You may need to resume your recording.",
    },
    trigger: null,
    identifier: "live-record/recording",
  });
};

const toastError = (error: ErrorEvent) => {
  toast({
    title: "An internal error occurred while recording",
    message: error.message,
    type: "error",
  });
};

export const LiveRecordInterruptListener = () => {
  const [
    shouldShowSilentRecordingModal,
    openSilentRecordingModal,
    closeSilentRecordingModal,
  ] = useBooleanState();

  const onDetectedSilence = useCallback(() => {
    openSilentRecordingModal();
    showNotificationOnSilence();
  }, [openSilentRecordingModal]);

  useIsRecordingSilent({
    onDetectedSilence,
  });

  const addEventListener = useRecorder((s) => s.addEventListener);
  const recordingState = useRecorder((s) => s.status.state);
  useEffect(() => {
    if (recordingState === "inactive") return;
    const interruptSub = addEventListener("interrupt", () => {
      showNotificationOnInterrupt();
    });
    const errorSub = addEventListener("error", toastError);
    return () => {
      interruptSub.remove();
      errorSub.remove();
    };
  }, [recordingState, addEventListener]);

  return (
    <>
      <SilentRecordingDialog
        isOpen={shouldShowSilentRecordingModal}
        close={closeSilentRecordingModal}
        title="No sound"
      />
    </>
  );
};

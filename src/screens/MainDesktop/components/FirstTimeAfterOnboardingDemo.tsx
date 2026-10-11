import { IconClose } from "@/assets/svg";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import {
  DESKTOP_FIRST_TIME_DEMO_FLAG_KEY,
  setLocalUserFlag,
} from "@/features/user-flags";
import {
  recorderApi,
  useRecordActionsContext,
  useRecorder,
} from "@/features/live-record";
import { useShouldShowOnboarding } from "@/features/onboarding";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { setSystemAudioStreamOverride } from "@/modules/audio-record";
import { DESKTOP_APP_DEMO_URL } from "@/constants";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { useDesktopVideoPlayer } from "@/hooks/useDesktopVideoPlayer";

/** Stop the active recording if any. Must be called first so recorder releases audio. */
async function forceStopRecordingIfActive() {
  const state = useRecorder.getState().status?.state;
  if (state !== "recording" && state !== "paused") return;
  // Tear the live window down BEFORE stopping the recording. Otherwise
  // LiveScreenContext (alive in the live window) sees the meeting transition
  // to ended and reparents the live WebContentsView — now rendering the
  // post-meeting panel — into the main desktop window.
  try {
    await window.electron?.liveView.closeWindow();
  } catch {
    /* best-effort */
  }
  try {
    await recorderApi.stop();
  } catch {
    /* best-effort */
  }
}

const demoVideoWrapperStyle = { height: "80%" as const };

const DemoVideoModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { startRecording, startInputs } = useRecordActionsContext();
  const hasStartedRecordingRef = useRef(false);

  const handleDemoClose = useCallback(() => {
    onClose();

    tracker.track(TRACKING_EVENTS.DESKTOP_APP_WATCHED_DEMO_VIDEO, {
      source: "desktop-onboarding",
    });

    void (async () => {
      await forceStopRecordingIfActive();
    })();
  }, [onClose]);

  const { setContainerRef, isPlaying, handlePlayPause, handleClose } =
    useDesktopVideoPlayer({
      url: DESKTOP_APP_DEMO_URL,
      onClose: handleDemoClose,
      onFirstPlay: (video) => {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        source.connect(audioCtx.destination);

        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        setSystemAudioStreamOverride?.(dest.stream);

        if (!hasStartedRecordingRef.current) {
          hasStartedRecordingRef.current = true;
          const inputs = {
            ...startInputs,
            title: startInputs.title?.trim() || "Fireflies Demo Meeting",
            skipLanguagePrompt: true,
            defaultShowLiveAssist: false,
            defaultShowNotes: true,
            isDemo: true,
          };
          startRecording(inputs).catch(() => {
            hasStartedRecordingRef.current = false;
          });
        }

        return () => {
          setSystemAudioStreamOverride?.(null);
          if (audioCtx.state !== "closed") {
            void audioCtx
              .suspend()
              .then(() => audioCtx.close())
              .catch(() => {});
          }
        };
      },
    });

  return (
    <VideoPlayerModal
      setContainerRef={setContainerRef}
      isPlaying={isPlaying}
      onPlayPause={handlePlayPause}
      videoWrapperStyle={demoVideoWrapperStyle}
      renderCloseButton={() => (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => void handleClose()}
          hitSlop={10}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <IconClose color="#fff" width={24} height={24} />
        </TouchableOpacity>
      )}
    />
  );
};

type FirstTimeAfterOnboardingDemoProps = {
  /** Only show the demo when the user has just landed on MainDesktop from desktop onboarding. */
  landedFromOnboarding?: boolean;
};

export const FirstTimeAfterOnboardingDemo = ({
  landedFromOnboarding = false,
}: FirstTimeAfterOnboardingDemoProps) => {
  const { completed, loading } = useShouldShowOnboarding();
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (loading || !completed || !landedFromOnboarding) return;
    setShowDemo(true);
  }, [landedFromOnboarding, completed, loading]);

  const handleClose = useCallback(() => {
    setLocalUserFlag(DESKTOP_FIRST_TIME_DEMO_FLAG_KEY, true);
    setShowDemo(false);
  }, []);

  if (!showDemo) return null;

  return <DemoVideoModal onClose={handleClose} />;
};

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 48,
    right: 24,
    zIndex: 1,
    padding: 8,
  },
});

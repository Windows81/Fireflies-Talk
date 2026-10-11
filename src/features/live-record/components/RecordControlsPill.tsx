import { IconPause, IconPlay, IconRecord } from "@/assets/svg";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, vars } from "@/styles";
import { useAppState } from "@/utils/app-state";
import { haptics, ImpactFeedbackStyle } from "@/utils/haptics";
import { useEffect, type FC, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useRecordActionsContext } from "../RecordActionsContext";
import { useRecordPhase } from "../record-phase.store";
import { recorderApi, useRecorder } from "../record.store";
import { RecordPhasePill } from "./RecordPhasePill";
import { RecordingDurationText } from "./RecordingDurationText";

/**
 * Recording controls: pause/resume + elapsed time + End. Deliberately free of
 * layout or entrance animations — the pill moves with the surrounding layout
 * (the keyboard opening, for one), and animating that reads as a bounce. The
 * only motion here is the paused timer's blink.
 */
export const RecordControlsPill: FC<{
  onEnd: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ onEnd, style }) => {
  const theme = useTheme();
  const recordingState = useRecorder((s) => s.status.state);
  const phase = useRecordPhase();
  const { toggleRecording } = useRecordActionsContext();

  // The End press is still running: the button reports it as a spinner.
  const isEnding = phase === "ending";

  const pillStyle = [styles.pill(theme), style];

  if (phase === "starting") {
    return (
      <View style={pillStyle}>
        <RecordPhasePill />
      </View>
    );
  }

  // Capture stops well before the recording is wrapped up, so the controls
  // stay put until the End press itself resolves.
  if (recordingState === "inactive" && !isEnding) {
    return (
      <View style={pillStyle}>
        <View style={styles.statusRow}>
          <PillUploadStatus />
        </View>
      </View>
    );
  }

  const isPaused = recordingState === "paused";

  return (
    <View style={pillStyle}>
      <Pressable
        style={styles.pauseButton}
        onPress={toggleRecording}
        disabled={isEnding}
        aria-label={isPaused ? "Resume recording" : "Pause recording"}
        role="button"
      >
        {isPaused ? (
          <IconPlay width={20} height={20} color={theme.colors.textMuted} />
        ) : (
          <IconPause width={20} height={20} color={theme.colors.textMuted} />
        )}
      </Pressable>
      {/* The timer blinks while paused so a stopped recording is obvious. */}
      <BlinkEffect isEnabled={isPaused}>
        <RecordingDurationText variant="body2Regular" color="textMuted" />
      </BlinkEffect>
      <Pressable
        style={styles.endButton(theme)}
        onPress={() => {
          // Confirms the tap landed, right as the button becomes a spinner.
          haptics.impact(ImpactFeedbackStyle.Light);
          onEnd();
        }}
        disabled={isEnding}
        aria-label={isEnding ? "Ending recording" : "End recording"}
        role="button"
      >
        {isEnding ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.commandDangerDefault}
          />
        ) : (
          <Text variant="label2Weight" color="commandDangerDefault">
            End
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const BLINK_TIMING = { duration: 650, easing: Easing.inOut(Easing.ease) };

const BlinkEffect: FC<{ isEnabled: boolean; children: ReactNode }> = ({
  isEnabled,
  children,
}) => {
  const appState = useAppState();
  const opacity = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(opacity);
    // Keep animations off in the background to avoid ANRs.
    opacity.value =
      isEnabled && appState === "active"
        ? withRepeat(withTiming(0.25, BLINK_TIMING), -1, true)
        : withTiming(1, { duration: 200 });
  }, [isEnabled, appState, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

/**
 * Upload/teardown status while the recorder is inactive. `isIdle` means
 * nothing is running at all (e.g. the start failed).
 */
export const useRecorderUploadStatus = (): {
  text: string;
  isError: boolean;
  isIdle: boolean;
} => {
  const streamingState = useRecorder((s) => s.status.streamingState);
  const streamingError = useRecorder((s) => s.status.streamingError);
  const fileReadOffset = useRecorder((s) => s.status.fileReadOffset);
  const fileSize = useRecorder((s) => s.status.fileSize);

  if (streamingError) {
    return { text: streamingError, isError: true, isIdle: false };
  }
  if (streamingState === "streaming") {
    const progress = Math.min(
      100,
      Math.floor((fileReadOffset / fileSize) * 100),
    );
    return { text: `Uploading ・ ${progress}%`, isError: false, isIdle: false };
  }
  if (streamingState === "connecting") {
    return { text: "Connecting to server...", isError: false, isIdle: false };
  }
  return { text: "Finalizing...", isError: false, isIdle: true };
};

const PillUploadStatus: FC = () => {
  const theme = useTheme();
  const { text, isError, isIdle } = useRecorderUploadStatus();
  const { startRecording } = useRecordActionsContext();

  // Fully inactive (e.g. the start failed) — offer to record again.
  if (isIdle) {
    return (
      <Pressable
        style={styles.recordButton}
        onPress={() => startRecording()}
        aria-label="Start recording"
        role="button"
      >
        <IconRecord width={20} height={20} color={theme.colors.textBrand} />
        <Text variant="body2Regular" color="textBrand">
          Record
        </Text>
      </Pressable>
    );
  }

  if (isError) {
    return (
      <>
        <Text
          variant="body2Regular"
          color="commandDangerDefault"
          numberOfLines={1}
          style={styles.statusText}
        >
          {text}
        </Text>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            recorderApi.startUpload().catch((err) => {
              toast({
                title: "Could not retry upload",
                message: (err as Error).message,
                type: "error",
              });
            });
          }}
        >
          Retry
        </Button>
      </>
    );
  }

  return (
    <Text variant="body2Regular" color="textMuted" style={styles.statusText}>
      {text}
    </Text>
  );
};

const styles = createStyles({
  pill: (theme) => ({
    ...vars.elevations[1],
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.layerDefault,
  }),
  pauseButton: {
    padding: 6,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: (theme) => ({
    height: 36,
    minWidth: 54,
    borderRadius: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.interactiveDangerSecondaryDefault,
  }),
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  statusText: {
    flexShrink: 1,
    paddingVertical: 8,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
    paddingRight: 8,
  },
});

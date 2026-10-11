import { IconPause, IconRecord, IconSquare } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { useRecorder } from "../record.store";
import { useRecordActionsContext } from "../RecordActionsContext";
import { createStyles, Fonts, useTheme, vars } from "@/styles";
import { useMemo, type FC } from "react";
import { Platform, Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/Button";
import { isDesktop } from "@/utils/device";

const RecordButton: FC<{
  startRecording: () => void;
  toggleRecording: () => void;
}> = ({ startRecording, toggleRecording }) => {
  const theme = useTheme();
  const recordingState = useRecorder((state) => state.status.state);

  const primaryButtonState =
    recordingState === "inactive" || recordingState === "paused"
      ? "record"
      : "pause";
  const recordInnerAnimStyle = useAnimatedStyle(
    () => ({
      width: withTiming(primaryButtonState === "record" ? 0 : 48),
      height: withTiming(primaryButtonState === "record" ? 0 : 48),
    }),
    [primaryButtonState],
  );

  const bottomLabel = useMemo(() => {
    if (recordingState === "inactive") {
      return "Record";
    } else if (recordingState === "paused") {
      return "Resume";
    }
    return "Pause";
  }, [recordingState]);

  return (
    <View style={styles.action}>
      <Pressable
        style={({ pressed }) => [
          styles.button(theme),
          recordingState === "inactive" && styles.record(theme),
          recordingState === "paused" && styles.recordPauseOuter,
          recordingState === "paused" && styles.recordPausePrompt,
          recordingState === "paused" &&
            pressed &&
            styles.recordPauseOuterPressed,
          recordingState === "inactive" &&
            pressed &&
            styles.recordPressed(theme),
        ]}
        onPress={() => {
          if (recordingState === "inactive") {
            startRecording();
          } else {
            toggleRecording();
          }
        }}
        aria-label={
          primaryButtonState === "record"
            ? "Start recording"
            : "Pause recording"
        }
        role="button"
      >
        <Animated.View style={[styles.recordInner, recordInnerAnimStyle]} />
        {primaryButtonState === "pause" ? (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.recordPauseIcon}
          >
            <IconPause color={vars.colors.grey700} width={20} height={20} />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.recordMicIcon}
          >
            <IconRecord
              color={
                recordingState === "paused"
                  ? isDesktop
                    ? theme.colors.textPrimary
                    : vars.colors.purple700
                  : theme.colors.commandContrastDefault
              }
              width={24}
              height={24}
            />
          </Animated.View>
        )}
      </Pressable>
      <Text
        variant={recordingState === "paused" ? "body1Weight" : "body1Regular"}
        color={recordingState === "paused" ? "textBrand" : "textMuted"}
      >
        {bottomLabel}
      </Text>
    </View>
  );
};

const WebRecordButton: FC<{
  startRecording: () => void;
  toggleRecording: () => void;
}> = ({ startRecording, toggleRecording }) => {
  const theme = useTheme();
  const recordingState = useRecorder((state) => state.status.state);

  // Desktop: disable pause/resume, only show start button when inactive
  // Web: keep pause/resume functionality
  const primaryButtonState =
    recordingState === "inactive" || recordingState === "paused"
      ? "record"
      : "pause";

  const buttonLabel = useMemo(() => {
    if (recordingState === "inactive") {
      return "Start Recording";
    } else if (recordingState === "paused") {
      return "Resume";
    }
    return "Pause";
  }, [recordingState]);

  const buttonVariant = useMemo(() => {
    if (recordingState === "inactive") {
      return "primary";
    } else if (recordingState === "paused") {
      return "secondary";
    }
    return "transparentNeutral";
  }, [recordingState]);

  // Hide pause/resume button for desktop when recording or paused
  if (isDesktop && recordingState !== "inactive") {
    return null;
  }

  return (
    <Button
      style={[
        styles.actionWeb,
        styles.recordWeb(theme),
        recordingState !== "inactive" && styles.webRecordBorder,
      ]}
      size="lg"
      variant={buttonVariant}
      onPress={() => {
        if (recordingState === "inactive") {
          startRecording();
        } else {
          toggleRecording();
        }
      }}
      Icon={() =>
        primaryButtonState === "pause" ? (
          <IconPause width={20} color={theme.colors.commandNeutralDefault} />
        ) : (
          <IconRecord
            width={20}
            color={
              recordingState === "paused"
                ? isDesktop
                  ? theme.colors.textPrimary
                  : vars.colors.purple700
                : vars.colors.grey25
            }
          />
        )
      }
    >
      {buttonLabel}
    </Button>
  );
};

const StopButton: FC<{
  stopRecording: () => void;
}> = ({ stopRecording }) => {
  const theme = useTheme();
  const recordingState = useRecorder((state) => state.status.state);

  if (recordingState === "inactive") return null;

  return (
    <View style={styles.action}>
      <Pressable
        style={({ pressed }) => [
          styles.button(theme),
          styles.buttonDisabled,
          pressed && styles.buttonDisabledPressed,
        ]}
        onPress={stopRecording}
        aria-label="Stop recording"
        role="button"
      >
        <IconSquare stroke="transparent" fill={vars.colors.red500} />
      </Pressable>
      <Text variant="body1Regular" color="textHint">
        Stop
      </Text>
    </View>
  );
};

const WebStopButton: FC<{
  stopRecording: () => void;
}> = ({ stopRecording }) => {
  const recordingState = useRecorder((state) => state.status.state);

  if (recordingState === "inactive") return null;

  return (
    <Button
      style={[styles.actionWeb, styles.stopWeb]}
      hoverStyle={styles.stopWebHover}
      onPress={stopRecording}
      aria-label="Stop recording"
      size="lg"
      Icon={() => (
        <IconSquare width={20} stroke="transparent" fill={vars.colors.grey25} />
      )}
    >
      Stop
    </Button>
  );
};

export const RecordControls: FC = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const streamingState = useRecorder((s) => s.status.streamingState);
  const streamingError = useRecorder((s) => s.status.streamingError);
  const { startRecording, stopRecording, toggleRecording } =
    useRecordActionsContext();

  if (
    (recordingState === "inactive" && streamingState !== "inactive") ||
    !!streamingError
  ) {
    return null;
  }

  return (
    <>
      <View style={styles.root}>
        <View
          style={[styles.actions, Platform.OS === "web" && styles.webActions]}
        >
          {Platform.OS === "web" ? (
            <>
              <WebRecordButton
                startRecording={startRecording}
                toggleRecording={toggleRecording}
              />
              <WebStopButton stopRecording={stopRecording} />
            </>
          ) : (
            <>
              <RecordButton
                startRecording={startRecording}
                toggleRecording={toggleRecording}
              />
              <StopButton stopRecording={stopRecording} />
            </>
          )}
        </View>
        {recordingState === "inactive" && (
          <Text
            variant="body2Regular"
            color="textMuted"
            style={styles.consentText}
          >
            Make sure to get participants consent when recording.
          </Text>
        )}
      </View>
    </>
  );
};

const styles = createStyles({
  root: {
    flexGrow: 1,
    maxWidth: 400,
    width: "80%",
    alignSelf: "center",
    justifyContent: "center",
    gap: 24,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  webActions: {
    gap: 12,
  },
  action: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  record: (theme) => ({
    backgroundColor:
      theme.name === "dark" ? vars.colors.purple700 : vars.colors.purple600,
  }),
  recordPressed: (theme) => ({
    backgroundColor:
      theme.name === "dark" ? vars.colors.purple800 : vars.colors.purple700,
  }),
  actionWeb: {
    width: "100%",
    flex: 1,
    borderRadius: 4,
  },
  recordWeb: (theme) => ({
    ...vars.elevations[1],
    borderColor: theme.colors.borderStaticDefault,
  }),
  stopWeb: {
    backgroundColor: vars.colors.red400,
    borderColor: "transparent",
  },
  stopWebHover: {
    backgroundColor: vars.colors.red500,
  },
  recordInner: {
    backgroundColor: "#ffffff",
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  recordPauseIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  recordMicIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  button: (theme) => ({
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9999,
    backgroundColor: theme.colors.interactiveNeutral3Default,
  }),
  buttonDisabled: {
    backgroundColor: vars.colors.red50,
  },
  buttonDisabledPressed: {
    backgroundColor: vars.colors.red100,
  },
  consentText: {
    textAlign: "center",
    maxWidth: Platform.OS === "web" ? 400 : "100%",
    fontFamily: Fonts.inter["400"].regular,
    paddingHorizontal: 32,
  },
  recordPauseOuter: {
    backgroundColor: vars.colors.purple50,
  },
  recordPausePrompt: {
    borderWidth: 2,
    borderColor: vars.colors.purple500,
    ...vars.elevations[2],
  },
  webRecordPauseOuter: {
    backgroundColor: vars.colors.purple50,
  },
  webRecordPauseHover: {
    backgroundColor: vars.colors.purple100,
  },
  recordPauseOuterPressed: {
    backgroundColor: vars.colors.purple100,
  },
  webRecordBorder: {
    borderWidth: 1,
    borderColor: vars.colors.grey200,
  },
});

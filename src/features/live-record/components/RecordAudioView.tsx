import { RecordIndicator } from "@/components/Animated";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { recorderApi, useRecorder } from "../record.store";
import { RecordingDurationText } from "./RecordingDurationText";
import { useEffect, useState, type FC } from "react";
import { Platform, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { RecordStartForm } from "./RecordStartForm";
import { RecordLanguageSelect } from "./RecordLanguageSelect";
import { IconPause, IconRecord } from "@/assets/svg";
import { createStyles, Fonts, useTheme } from "@/styles";
import { AnimatedAudioWave } from "@/components/AnimatedAudioWave";
import { isDesktop } from "@/utils/device";

const PendingStreamErrorStatusView: FC<{
  error: string;
}> = ({ error }) => {
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.statusView}>
      <Text variant="title2Regular">Could not upload recording</Text>
      <Text
        variant="body2Regular"
        color="commandDangerDefault"
        style={styles.textCentered}
      >
        {error}
      </Text>
      <View style={styles.statusActions}>
        <Button
          variant="secondary"
          onPress={() => {
            recorderApi.release();
            toast({
              title: "Upload cancelled",
              message:
                "You can reupload the recording via the Local Recordings tab.",
              type: "info",
            });
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={() => {
            setLoading(true);
            recorderApi
              .startUpload()
              .catch((err) => {
                toast({
                  title: "Could not retry upload",
                  message: (err as Error).message,
                  type: "error",
                });
              })
              .finally(() => setLoading(false));
          }}
          disabled={loading}
        >
          Retry
        </Button>
      </View>
    </View>
  );
};

const PendingStreamStatusView: FC = () => {
  const streamingState = useRecorder((s) => s.status.streamingState);
  const fileReadOffset = useRecorder((s) => s.status.fileReadOffset);
  const fileSize = useRecorder((s) => s.status.fileSize);

  const [showLongConnectingMessage, setShowLongConnectingMessage] =
    useState(false);

  useEffect(() => {
    if (streamingState === "connecting") {
      const timeout = setTimeout(() => {
        // wait for 10 seconds before showing the error message
        setShowLongConnectingMessage(true);
      }, 10000);

      return () => {
        clearTimeout(timeout);
      };
    } else {
      setShowLongConnectingMessage(false);
    }
  }, [streamingState]);

  return (
    <>
      <View style={styles.statusView}>
        <Text variant="title2Regular">
          {streamingState === "connecting"
            ? `Connecting to server...`
            : `Uploading recording ・ ${Math.floor((fileReadOffset / fileSize) * 100)}%`}
        </Text>
        <Text
          variant="body2Regular"
          color="textHint"
          style={styles.textCentered}
        >
          Your recording is being uploaded. Closing the application will stop it
          from completing.
        </Text>
      </View>
      {showLongConnectingMessage && (
        <View style={styles.statusView}>
          <Text
            variant="body2Regular"
            color="commandDangerDefault"
            style={styles.textCentered}
          >
            We are unable to connect to the server. Please check your internet
            connection, and the app will try to reconnect automatically. If the
            problem persists, please contact our support team.
          </Text>
        </View>
      )}
    </>
  );
};

const PausedDurationBlink: FC<{ isPaused: boolean }> = ({ isPaused }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isPaused) {
      opacity.value = withRepeat(withTiming(0.25, { duration: 600 }), -1, true);
    } else {
      cancelAnimation(opacity);
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isPaused, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animStyle}>
      <RecordingDurationText
        variant="heading2"
        color={isPaused ? "commandDangerDefault" : "textSecondary"}
        maxFontSizeMultiplier={1.25}
        style={styles.durationText}
      />
    </Animated.View>
  );
};

const OngoingRecordingStatusView: FC = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const theme = useTheme();

  return (
    <View style={styles.status}>
      {Platform.OS === "web" && (
        <>
          <Text
            variant="title2Regular"
            color="textSecondary"
            style={styles.newRecordingText}
          >
            {recordingState === "inactive"
              ? isDesktop
                ? "New Capture"
                : "New Recording"
              : isDesktop
                ? "Capturing"
                : "Recording"}
          </Text>
          {recordingState === "inactive" ? (
            <View style={styles.newRecordIcon(theme)}>
              <IconRecord
                width={20}
                height={20}
                color={theme.colors.textMuted}
              />
            </View>
          ) : (
            <AnimatedAudioWave recordingState={recordingState} />
          )}
        </>
      )}

      <View style={styles.form}>
        <RecordStartForm />
      </View>
      {recordingState === "paused" ? (
        <IconPause width={15} height={15} color={theme.colors.textDisabled} />
      ) : recordingState !== "inactive" ? (
        <RecordIndicator size={16} />
      ) : null}
      <View style={styles.statusView}>
        {recordingState === "inactive" ? (
          <RecordingDurationText
            variant="heading2"
            color="textSecondary"
            maxFontSizeMultiplier={1.25}
          />
        ) : (
          <PausedDurationBlink isPaused={recordingState === "paused"} />
        )}
      </View>
      {recordingState === "paused" && (
        <Text variant="body2Weight" color="commandDangerDefault">
          Recording paused
        </Text>
      )}
      {!isDesktop && <RecordLanguageSelect />}
    </View>
  );
};

export const RecordAudioView: FC = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const streamingState = useRecorder((s) => s.status.streamingState);
  const streamingError = useRecorder((s) => s.status.streamingError);

  const pending =
    (recordingState === "inactive" && streamingState !== "inactive") ||
    !!streamingError;

  return (
    <View style={styles.root}>
      {pending ? (
        streamingError ? (
          <PendingStreamErrorStatusView error={streamingError} />
        ) : (
          <PendingStreamStatusView />
        )
      ) : (
        <OngoingRecordingStatusView />
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    flexGrow: 1,
  },
  status: {
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    width: "100%",
  },
  textCentered: {
    textAlign: "center",
  },
  statusView: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
    maxWidth: 360,
    width: "100%",
  },
  statusActions: {
    flexDirection: "row",
    gap: 12,
  },
  form: {
    marginTop: 12,
    marginBottom: 32,
    width: "80%",
    gap: 8,
    maxWidth: 400,
    alignItems: "center",
  },
  newRecordIcon: (theme) => ({
    borderWidth: 1,
    borderRadius: 8,
    borderColor: theme.colors.borderStaticSubtle,
    height: 44,
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  }),
  durationText: {
    marginTop: 8,
  },
  newRecordingText: {
    marginTop: 16,
    fontFamily: Fonts.inter["400"].regular,
  },
});

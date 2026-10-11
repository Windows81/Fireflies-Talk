import { type FC } from "react";
import { View } from "react-native";
import { createStyles, useTheme } from "@/styles";
import { Text } from "@/components/Typography";
import { IconPause } from "@/assets/svg";
import { RecordIndicator } from "@/components/Animated";
import { useRecorder } from "../record.store";
import { RecordingDurationText } from "./RecordingDurationText";

/** Compact recorder status (duration or upload progress), desktop header chip. */
export const CompactAudioView: FC = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const streamingState = useRecorder((s) => s.status.streamingState);
  const streamingError = useRecorder((s) => s.status.streamingError);
  const fileReadOffset = useRecorder((s) => s.status.fileReadOffset);
  const fileSize = useRecorder((s) => s.status.fileSize);
  const theme = useTheme();

  const textColor =
    recordingState === "inactive" && streamingError
      ? ("commandDangerDefault" as const)
      : ("textPrimary" as const);

  const renderStatusContent = () => {
    if (recordingState === "inactive") {
      if (streamingError) {
        return streamingError;
      } else if (streamingState === "connecting") {
        return "Connecting to server...";
      } else if (streamingState === "streaming") {
        const progress = Math.min(
          100,
          Math.floor((fileReadOffset / fileSize) * 100),
        );
        return `Uploading ・ ${progress}%`;
      }
      return "Finalizing...";
    }

    return <RecordingDurationText variant="body1Regular" color={textColor} />;
  };

  return (
    <View style={styles.leading}>
      <View style={styles.compactIndicatorContainer}>
        {recordingState === "paused" ? (
          <IconPause width={16} color={theme.colors.commandNeutralDefault} />
        ) : (
          <RecordIndicator
            invisible={recordingState !== "recording"}
            size={8}
          />
        )}
      </View>
      {typeof renderStatusContent() === "string" ? (
        <Text variant="body1Regular" color={textColor}>
          {renderStatusContent()}
        </Text>
      ) : (
        renderStatusContent()
      )}
    </View>
  );
};

const styles = createStyles({
  leading: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  compactIndicatorContainer: {
    width: 16,
  },
});

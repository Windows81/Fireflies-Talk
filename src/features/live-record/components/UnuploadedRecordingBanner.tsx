import { Text } from "@/components/Typography";
import { type PhoneCallStates } from "@/features/phone-call";
import { useUpload } from "@/features/upload";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable } from "react-native";
import { useLocalRecordStore } from "../local-record.store";
import type { RecordingStates } from "../types";
import { IconInfo } from "@/assets/svg";

export const UnuploadedRecordingBanner: FC<{
  openRecordings: () => void;
  state: RecordingStates["state"] | PhoneCallStates["state"];
  streamingState?: RecordingStates["streamingState"];
}> = ({ openRecordings, state, streamingState }) => {
  const { recordings } = useLocalRecordStore();
  const { uploads } = useUpload();

  const hasUnuploadedRecordings = recordings.some(
    (r) =>
      (!r.uploaded && !r.streamed) ||
      (!uploads.some((u) => r.fileUris.includes(u.fileUri)) && !r.meetingId),
  );

  const theme = useTheme();

  if (
    !hasUnuploadedRecordings ||
    state !== "inactive" ||
    streamingState !== "inactive"
  ) {
    return null;
  }

  return (
    <Pressable style={styles.root(theme)} onPress={openRecordings}>
      <IconInfo width={16} color={theme.colors.textSecondary} />
      <Text variant="body2Regular" color="textSecondary">
        You have unuploaded recordings
      </Text>
      <Text
        variant="link2Regular"
        color="informationStaticBlueText"
        style={{ textDecorationLine: "underline" }}
      >
        View Recordings
      </Text>
    </Pressable>
  );
};

const styles = createStyles({
  root: (theme) => ({
    backgroundColor: theme.colors.informationStaticBlueSubtle,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  }),
});

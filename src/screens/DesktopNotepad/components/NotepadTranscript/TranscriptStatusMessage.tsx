import { MessageView } from "@/components/Message";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import type { TranscriptStatus } from "../../types";

type EmptyStatus = Exclude<TranscriptStatus, "ready">;

const STATUS_MESSAGES: Record<
  EmptyStatus,
  { title: string; description: string }
> = {
  transcribing: {
    title: "Transcription in progress",
    description: "Come back in a few minutes once the meeting is transcribed.",
  },
  failed: {
    title: "Unable to transcribe meeting",
    description: "Something went wrong while transcribing this meeting.",
  },
  silent: {
    title: "No spoken words detected",
    description: "This meeting has no words to transcribe.",
  },
  "not-transcribed": {
    title: "Transcript is not available",
    description: "This meeting has not been transcribed yet.",
  },
};

export const TranscriptStatusMessage: FC<{ status: EmptyStatus }> = ({
  status,
}) => {
  const message = STATUS_MESSAGES[status];

  return (
    <View style={styles.container}>
      <MessageView title={message.title} description={message.description} />
    </View>
  );
};

const styles = createStyles({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});

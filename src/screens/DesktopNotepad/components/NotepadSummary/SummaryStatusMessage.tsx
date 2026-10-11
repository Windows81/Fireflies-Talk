import { MessageView } from "@/components/Message";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import type { SummaryUnavailableReason } from "../../types";

const REASON_MESSAGES: Record<
  SummaryUnavailableReason,
  { title: string; description: string }
> = {
  failed: {
    title: "Summary is not available",
    description: "Something went wrong while summarizing this meeting.",
  },
  silent: {
    title: "No spoken words detected",
    description: "This meeting has no spoken words to summarize.",
  },
  "not-enough-transcript": {
    title: "Summary is not available",
    description:
      "This meeting does not have enough transcript to generate a summary.",
  },
  skipped: {
    title: "Summary is not available",
    description: "This meeting was not summarized.",
  },
  stalled: {
    title: "Summary is taking longer than usual",
    description: "Open this meeting again in a few minutes to check on it.",
  },
};

export const SummaryStatusMessage: FC<{
  reason: SummaryUnavailableReason;
}> = ({ reason }) => {
  const message = REASON_MESSAGES[reason];

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

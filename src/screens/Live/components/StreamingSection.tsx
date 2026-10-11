import { Markdown } from "@/components/Markdown";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { View } from "react-native";
import { useExternalLinkHandler } from "@/features/ask-fred";
import { useStreamingText } from "@/hooks/useStreamingText";
import { createStyles } from "@/styles";

export const StreamingSection: FC<{
  content: string;
  meeting: Meeting;
  isCompleted?: boolean;
  onStreamingComplete?: () => void;
}> = ({ content, meeting, isCompleted = true, onStreamingComplete }) => {
  const onLinkPress = useExternalLinkHandler(meeting);
  const displayedContent = useStreamingText(
    content,
    isCompleted,
    onStreamingComplete,
  );

  if (!displayedContent || displayedContent.trim().length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Markdown onLinkPress={onLinkPress} color="textSecondary">
        {displayedContent}
      </Markdown>
    </View>
  );
};

const styles = createStyles({
  container: {
    width: "100%",
  },
});

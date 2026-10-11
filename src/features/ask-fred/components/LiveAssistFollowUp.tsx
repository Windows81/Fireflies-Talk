import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { View } from "react-native";
import { useAssistThread } from "../providers/AssistThreadContext";
import { IconComment } from "@/assets/svg";
import { Logger } from "@/logger";
import {
  ASKFRED_SUGGESTION_SOURCE,
  ASK_FRED_REF_SOURCE,
} from "../constants/config";
import { Button } from "@/components/Button";

const logger = new Logger("LiveAssistFollowUp");
interface LiveAssistFollowUpProps {
  meeting: Meeting;
  lastMessageId?: string;
  suggestedQueries?: string[];
}

export const LiveAssistFollowUp: FC<LiveAssistFollowUpProps> = ({
  meeting,
  lastMessageId,
  suggestedQueries,
}) => {
  const theme = useTheme();
  const { askFred, isAnyAssistLoading } = useAssistThread();

  const handleFollowUp = async (suggestion: string) => {
    if (isAnyAssistLoading) return;

    try {
      await askFred(
        suggestion,
        ASKFRED_SUGGESTION_SOURCE.ASSIST_FRED_PANEL_SUGGESTIONS_FOLLOW_UP,
        ASK_FRED_REF_SOURCE.ASSIST_AGENT_SOURCE,
      );

      tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
        meetingId: meeting.id,
        queryLength: suggestion.length,
        isSuggestedPrompt: true,
        source: "follow-up",
        liveAssist: true,
      });
    } catch (err) {
      logger.error("Failed to get follow-up questions", { err });
    }
  };

  const hasSuggestedQueries = (suggestedQueries?.length || 0) > 0;

  if (!hasSuggestedQueries) {
    return null;
  }

  const suggestions = (suggestedQueries || []).slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <IconComment
          width={18}
          height={18}
          color={theme.colors.commandHintDefault}
        />
        <Text color="textMuted" variant="title3Regular">
          Suggested
        </Text>
      </View>
      <View style={styles.suggestions}>
        {suggestions.map((suggestion, index) => (
          <Button
            key={`${lastMessageId}-${index}`}
            variant="secondary"
            onPress={() => handleFollowUp(suggestion)}
            disabled={isAnyAssistLoading}
            style={styles.suggestionChip(theme)}
          >
            <Text
              color="textPrimary"
              variant="body2Regular"
              style={styles.suggestionText}
            >
              {suggestion}
            </Text>
          </Button>
        ))}
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    paddingHorizontal: 6,
    paddingTop: 8,
    gap: 8,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    maxWidth: "100%",
    flexShrink: 1,
  }),
  titleContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginVertical: 8,
  },
  suggestionText: {
    flexShrink: 1,
  },
});

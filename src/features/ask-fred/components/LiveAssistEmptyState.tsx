import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { useAssistThread } from "../providers/AssistThreadContext";
import {
  DEFAULT_LIVE_ASSIST_SUGGESTIONS,
  DEFAULT_POST_MEETING_SUGGESTIONS,
} from "@/constants";
import { shuffle } from "@/utils/array";
import {
  ASKFRED_SUGGESTION_SOURCE,
  ASK_FRED_REF_SOURCE,
} from "../constants/config";
import { isLiveMeeting } from "@/features/live";
import { useAuth } from "@/features/auth";
import { parseUserDisplayContent } from "../utils/message-helpers";
import { Button } from "@/components/Button";
import { IconSparkle } from "@/assets/svg";

export const LiveAssistEmptyState: FC<{
  meeting: Meeting;
  promptSuggestions?: string[] | null;
  compact?: boolean;
}> = ({ meeting, promptSuggestions, compact }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { askFred, isAnyAssistLoading } = useAssistThread();

  const doAskFred = async (suggestedPrompt: string) => {
    if (isAnyAssistLoading) return;

    await askFred(
      suggestedPrompt,
      ASKFRED_SUGGESTION_SOURCE.ASSIST_FRED_PANEL_FIXED_SUGGESTION,
      ASK_FRED_REF_SOURCE.ASSIST_AGENT_SOURCE,
    );

    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId: meeting.id,
      queryLength: suggestedPrompt.length,
      isSuggestedPrompt: true,
    });
  };

  const isMeetingEnded = meeting ? !isLiveMeeting(meeting) : false;

  const suggestedPrompts = useMemo(() => {
    if (promptSuggestions && promptSuggestions.length > 0) {
      // Use meeting-specific suggestions if available
      return shuffle(Array.from(promptSuggestions))
        .slice(0, 3)
        .map((suggestion) => ({
          suggestion,
          emoji: "💬",
        }));
    } else {
      // Use default suggestions if no meeting-specific ones
      // Create a copy to avoid mutating the constant
      return [
        ...(isMeetingEnded
          ? DEFAULT_POST_MEETING_SUGGESTIONS
          : DEFAULT_LIVE_ASSIST_SUGGESTIONS(user?.name ?? "user")),
      ];
    }
  }, [promptSuggestions, isMeetingEnded, user]);

  if (compact) {
    return (
      <View style={styles.compactRoot}>
        {suggestedPrompts.map((suggestion, index: number) => (
          <Button
            key={index}
            variant="secondary"
            disabled={isAnyAssistLoading}
            onPress={() => doAskFred(suggestion.suggestion)}
            style={styles.compactButton}
          >
            <IconSparkle
              color={theme.colors.commandNeutralDisabled}
              width={16}
              height={16}
            />
            <Text variant="body3Regular">
              {parseUserDisplayContent(suggestion.suggestion)}
            </Text>
          </Button>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text color="textHint" variant="title3Regular">
          Ask anything
        </Text>
        <View style={styles.prompts}>
          {suggestedPrompts.map((suggestion, index: number) => (
            <Button
              key={index}
              disabled={isAnyAssistLoading}
              variant="secondary"
              onPress={() => doAskFred(suggestion.suggestion)}
              style={styles.promptButton(theme)}
              size="xs"
            >
              <IconSparkle
                color={theme.colors.commandNeutralDisabled}
                width={16}
                height={16}
              />
              <Text
                numberOfLines={2}
                color="textSecondary"
                variant="body2Regular"
                style={styles.promptText}
              >
                {parseUserDisplayContent(suggestion.suggestion)}
              </Text>
            </Button>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    marginLeft: 4,
  },
  content: {
    gap: 16,
    marginRight: 4,
  },
  prompts: {
    gap: 10,
  },
  promptButton: (theme) => ({
    borderColor: theme.colors.borderStaticSubtle,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
    alignSelf: "flex-start",
    maxHeight: 40,
  }),
  emoji: {
    fontSize: 20,
  },
  promptText: {
    flex: 1,
  },
  compactRoot: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  compactButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
});

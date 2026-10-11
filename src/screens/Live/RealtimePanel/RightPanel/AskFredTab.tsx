import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import {
  ASK_FRED_REF_SOURCE,
  ASKFRED_SUGGESTION_SOURCE,
} from "@/features/ask-fred/constants/config";
import {
  AskFredPaywallBanner,
  useAskFredPaywall,
  useAssistThread,
  type AskFredPaywallSource,
} from "@/features/ask-fred";
import { LiveAssistInput } from "@/features/ask-fred/components/LiveAssistInput";
import { LiveAssistMessages } from "@/features/ask-fred/components/LiveAssistMessages";
import { parseUserDisplayContent } from "@/features/ask-fred/utils/message-helpers";
import { type Meeting } from "@/graphql";
import { useShakeAnimation } from "@/hooks/useShakeAnimation";
import { createStyles, useTheme } from "@/styles";
import { useQuery } from "@apollo/client";
import { GetMeetingSummaryQueryDocument } from "@firefliesai/mobile-ff.graphql-client";
import { useThread } from "@firefliesai/fred-react";
import { type FC, useMemo } from "react";
import { Pressable, View } from "react-native";

const MAX_SUGGESTIONS = 4;

const PAYWALL_SOURCE: AskFredPaywallSource = {
  pwl: "desktop_realtime-panel-ask-fred",
  from: "desktop-realtime-panel-ask-fred",
};

interface Suggestion {
  emoji: string;
  label: string;
  prompt: string;
}

const FALLBACK_SUGGESTIONS: Suggestion[] = [
  {
    emoji: "✨",
    label: "Summaries so far",
    prompt: "Summarize the meeting so far in bullet points.",
  },
  {
    emoji: "🧠",
    label: "Catch up on last 1 min",
    prompt: "Catch me up on the last 1 minute of the conversation.",
  },
  {
    emoji: "💬",
    label: "Suggested questions to ask",
    prompt:
      "Suggest follow-up questions I could ask next based on the conversation so far.",
  },
  {
    emoji: "🎯",
    label: "Extract action items",
    prompt: "List the action items mentioned in the meeting so far.",
  },
];

const getFirstName = (fullName?: string) =>
  fullName?.trim().split(" ")[0] ?? "";

export const AskFredTab: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const { messages } = useThread();
  const hasConversation = (messages?.length ?? 0) > 0;
  const paywall = useAskFredPaywall(PAYWALL_SOURCE);
  const { style: shakeStyle, shake } = useShakeAnimation();

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {hasConversation ? (
          <LiveAssistMessages meeting={meeting} />
        ) : (
          <EmptyState
            meeting={meeting}
            onBlockedPress={paywall ? shake : undefined}
          />
        )}
      </View>
      {paywall && <AskFredPaywallBanner paywall={paywall} style={shakeStyle} />}
      <LiveAssistInput
        meeting={meeting}
        maxLines={3}
        compact
        placeholder="AskFred anything…"
        onBlockedPress={shake}
      />
    </View>
  );
};

const EmptyState: FC<{
  meeting: Meeting;
  /**
   * Set while the pane is paywalled. The suggestions stay visible as a preview
   * of what AskFred does, but pressing one nudges the paywall instead of
   * sending the prompt.
   */
  onBlockedPress?: () => void;
}> = ({ meeting, onBlockedPress }) => {
  const { user } = useAuth();
  const { askFred, isAnyAssistLoading } = useAssistThread();
  const { data } = useQuery(GetMeetingSummaryQueryDocument, {
    variables: { meetingId: meeting.id },
  });

  const promptSuggestions = data?.meetingSummary.summary?.promptSuggestions;
  const firstName = getFirstName(user?.name);

  const suggestions = useMemo(
    () => buildSuggestions(promptSuggestions),
    [promptSuggestions],
  );

  const onPickSuggestion = (prompt: string) => {
    if (onBlockedPress) {
      onBlockedPress();
      return;
    }
    if (isAnyAssistLoading) return;
    askFred(
      prompt,
      ASKFRED_SUGGESTION_SOURCE.ASSIST_FRED_PANEL_FIXED_SUGGESTION,
      ASK_FRED_REF_SOURCE.ASSIST_AGENT_SOURCE,
    );
  };

  return (
    <View style={styles.emptyRoot}>
      <View style={styles.greeting}>
        <Text variant="title1Weight" color="textSecondary">
          {firstName ? `Hi ${firstName}!` : "Hi!"}
          {"\n"}Ask me anything about your meeting.
        </Text>
      </View>
      <View style={styles.chips}>
        {suggestions.map((item, index) => (
          <SuggestionChip
            key={index}
            suggestion={item}
            disabled={isAnyAssistLoading}
            onPress={() => onPickSuggestion(item.prompt)}
          />
        ))}
      </View>
    </View>
  );
};

const SuggestionChip: FC<{
  suggestion: Suggestion;
  disabled: boolean;
  onPress: () => void;
}> = ({ suggestion, disabled, onPress }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      {...webHoverProps}
      style={[styles.chip(theme), isHovered && styles.chipHover(theme)]}
    >
      <Text variant="body2Regular" style={styles.chipEmoji}>
        {suggestion.emoji}
      </Text>
      <Text
        numberOfLines={2}
        variant="body2Regular"
        color="textMuted"
        style={styles.chipText}
      >
        {suggestion.label}
      </Text>
    </Pressable>
  );
};

const buildSuggestions = (
  promptSuggestions: string[] | null | undefined,
): Suggestion[] => {
  if (promptSuggestions && promptSuggestions.length > 0) {
    return promptSuggestions.slice(0, MAX_SUGGESTIONS).map((prompt) => ({
      emoji: "💬",
      label: parseUserDisplayContent(prompt),
      prompt,
    }));
  }

  return FALLBACK_SUGGESTIONS;
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  emptyRoot: {
    flex: 1,
    justifyContent: "center",
    gap: 48,
  },
  greeting: {
    gap: 20,
  },
  chips: {
    gap: 16,
    alignItems: "flex-start",
  },
  chip: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 12,
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
  chipHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    flexShrink: 1,
  },
});

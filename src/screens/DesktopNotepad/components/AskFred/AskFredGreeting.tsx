import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { shuffle } from "@/utils/array";
import { useThread } from "@firefliesai/fred-react";
import { useMemo, type FC } from "react";
import { Pressable, View } from "react-native";
import { ASSISTANT_SUGGESTIONS } from "../../constants";

interface Suggestion {
  emoji?: string;
  label: string;
  prompt: string;
}

const MAX_SUGGESTIONS = 4;

const SuggestionChip: FC<{
  suggestion: Suggestion;
  onPress: () => void;
}> = ({ suggestion, onPress }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      {...webHoverProps}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.chip(theme), isHovered && styles.chipHover(theme)]}
    >
      {suggestion.emoji ? (
        <Text variant="body2Regular">{suggestion.emoji}</Text>
      ) : null}
      <Text variant="body2Regular" color="textMuted" style={styles.chipLabel}>
        {suggestion.label}
      </Text>
    </Pressable>
  );
};

export const AskFredGreeting: FC<{
  meetingId: string;
  promptSuggestions?: string[];
  /**
   * Set while the pane is paywalled. The suggestions stay visible as a preview
   * of what AskFred does, but pressing one nudges the paywall instead of
   * sending the prompt.
   */
  onBlockedPress?: () => void;
}> = ({ meetingId, promptSuggestions, onBlockedPress }) => {
  const { user } = useAuth();
  const { submit, isLoading } = useThread();

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const suggestions = useMemo<Suggestion[]>(() => {
    if (promptSuggestions?.length) {
      return shuffle(Array.from(promptSuggestions))
        .slice(0, MAX_SUGGESTIONS)
        .map((prompt) => ({ label: prompt, prompt }));
    }
    return ASSISTANT_SUGGESTIONS.map((suggestion) => ({
      emoji: suggestion.emoji,
      label: suggestion.label,
      prompt: suggestion.label,
    }));
  }, [promptSuggestions]);

  const onSuggestionPress = async (suggestion: Suggestion) => {
    if (onBlockedPress) {
      onBlockedPress();
      return;
    }
    if (isLoading) return;
    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId,
      queryLength: suggestion.prompt.length,
      isSuggestedPrompt: true,
      platform: "desktop-notepad",
    });
    tracker.track(TRACKING_EVENTS.NOTEPAD_ASK_FRED_USED, {
      meetingId,
      method: "suggestion",
    });

    await submit({
      input: suggestion.prompt,
      source: "ask-fred-v1",
      refSource: "desktop-notepad",
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.greeting}>
        <Text variant="title1Weight" color="textSecondary">
          Hi {firstName}!{"\n"}Ask me anything about your meeting.
        </Text>
      </View>
      <View style={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <SuggestionChip
            key={suggestion.label}
            suggestion={suggestion}
            onPress={() => onSuggestionPress(suggestion)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    gap: 48,
  },
  greeting: {
    gap: 20,
  },
  suggestions: {
    gap: 16,
    alignItems: "flex-start",
  },
  chip: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
  chipHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  chipLabel: {
    flexShrink: 1,
  },
});

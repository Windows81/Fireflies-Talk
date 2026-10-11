import { IconFred } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { useAskFredOSubmit } from "../hooks/useAskFredOSubmit";

const SUGGESTIONS = [
  "What did I commit to in my last meeting?",
  "Summarise my week and what needs follow-up",
  "Which deals went quiet in the last 30 days?",
];

export const AskFredOEmptyState: FC = () => {
  const theme = useTheme();
  const { isInteractionBlocked, submitQuestion } = useAskFredOSubmit();

  return (
    <View style={styles.root}>
      <IconFred width={40} height={40} />
      <Text color="textPrimary" variant="title2Weight" textAlign="center">
        Ask across all your meetings
      </Text>
      <Text color="textSecondary" variant="body2Regular" textAlign="center">
        Fred can search your meetings, pull out decisions and follow up on what
        matters.
      </Text>

      <View style={styles.suggestions}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            style={[
              styles.suggestion(theme),
              isInteractionBlocked && styles.suggestionDisabled,
            ]}
            onPress={() => void submitQuestion(suggestion, "suggestion")}
            accessibilityRole="button"
            accessibilityState={{ disabled: isInteractionBlocked }}
          >
            <Text color="textSecondary" variant="body2Regular">
              {suggestion}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  suggestions: {
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },
  suggestion: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  }),
  suggestionDisabled: {
    opacity: 0.5,
  },
});

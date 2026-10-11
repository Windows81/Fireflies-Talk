import { IconAlignLeft } from "@/assets/svg";
import { AnimatedTouchableOpacity } from "@/components/Animated";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { useThread } from "@firefliesai/fred-react";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { FadeInRight } from "react-native-reanimated";
import { AskFredResponseFredMessage } from "./AskFredResponseFredMessage";
import { shuffle } from "@/utils/array";
import { ASK_FRED_SUBMIT_PARAMS } from "../constants/config";
import type { AskFredSubmitParams } from "../types/askFred";

export const AskFredEmptyState: FC<{
  meeting: Pick<Meeting, "id">;
  promptSuggestions?: string[];
  submitParams?: AskFredSubmitParams;
}> = ({
  meeting,
  promptSuggestions,
  submitParams = ASK_FRED_SUBMIT_PARAMS,
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  const { submit, isLoading } = useThread();

  const doAskFred = async (suggestedPrompt: string) => {
    if (isLoading) return;
    await submit({ ...submitParams, input: suggestedPrompt });
    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId: meeting.id,
      queryLength: suggestedPrompt.length,
      isSuggestedPrompt: true,
    });
  };

  const suggestedPrompts = useMemo(
    () =>
      promptSuggestions
        ? shuffle(Array.from(promptSuggestions))
            // get random 3 suggestions
            .slice(0, 3)
        : null,
    [promptSuggestions],
  );

  const displayName = user?.name ?? "there";

  return (
    <View style={styles.qa}>
      <AskFredResponseFredMessage
        answer={`Hi ${displayName},\nI am Fred your AI Assistant who can help you answer any question from your meeting, generate content and more.\n\nTry asking...`}
        meeting={meeting}
      />
      {isLoading && !suggestedPrompts?.length && (
        <AskFredResponseFredMessage answer={null} meeting={meeting} />
      )}
      {suggestedPrompts?.map((suggestedPrompt, index) => (
        <AnimatedTouchableOpacity
          key={suggestedPrompt}
          style={styles.suggestedPrompt(theme)}
          onPress={() => doAskFred(suggestedPrompt)}
          entering={FadeInRight.duration(300).delay(index * 100)}
        >
          <View style={styles.suggestedPromptIcon(theme)}>
            <IconAlignLeft
              color={theme.colors.textHint}
              width={14}
              height={14}
            />
          </View>
          <Text color="textSecondary" style={styles.suggestedPromptText}>
            {suggestedPrompt}
          </Text>
        </AnimatedTouchableOpacity>
      ))}
    </View>
  );
};

const styles = createStyles({
  qa: {
    gap: 12,
    flex: 1,
  },
  suggestedPrompt: (theme) => ({
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    width: "85%",
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  }),
  suggestedPromptIcon: (theme) => ({
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 4,
  }),
  suggestedPromptText: {
    flex: 1,
  },
});

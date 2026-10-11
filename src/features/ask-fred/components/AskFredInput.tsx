import { useCallback } from "react";
import { TextInput } from "@/components/Input";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { View } from "react-native";
import { useThread } from "@firefliesai/fred-react";
import { useBilling } from "@/features/billing";
import { Logger } from "@/logger";
import { ASK_FRED_SUBMIT_PARAMS } from "../constants/config";
import type { AskFredSubmitParams } from "../types/askFred";

const logger = new Logger("AskFredInput");

export const AskFredInput: FC<{
  meeting: Meeting;
  submitParams?: AskFredSubmitParams;
}> = ({ meeting, submitParams = ASK_FRED_SUBMIT_PARAMS }) => {
  const theme = useTheme();
  const { input, setInput, submit, isLoading } = useThread();
  const { isAllowedToUsePrompts } = useBilling();

  const onSubmit = useCallback(async () => {
    if (isLoading) return;
    const query = input.trim();
    if (!query) return;

    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId: meeting.id,
      queryLength: query.length,
    });

    try {
      await submit({ ...submitParams, input: query });
      setInput("");
    } catch (error) {
      logger.error("Failed to submit Fred question:", { error });
    }
  }, [input, isLoading, meeting.id, setInput, submit, submitParams]);

  const disabled = isLoading || !isAllowedToUsePrompts;

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.input(theme)}
        submitButton
        placeholder={
          !isAllowedToUsePrompts
            ? "Prompts are disabled for your plan"
            : isLoading
              ? "Generating response..."
              : "Ask anything, AskFred"
        }
        returnKeyType="search"
        autoFocus={isAllowedToUsePrompts}
        value={input}
        onValueChange={setInput}
        onSubmitEditing={onSubmit}
        disabled={disabled}
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    padding: 12,
  },
  input: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 0,
    borderRadius: 12,
  }),
});

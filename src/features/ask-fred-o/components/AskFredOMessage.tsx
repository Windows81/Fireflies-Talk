import { Text } from "@/components/Typography";
import { AskFredResponseBubble } from "@/features/ask-fred/components/AskFredResponseBubble";
import { AskFredUserMessageBubble } from "@/features/ask-fred/components/AskFredUserMessageBubble";
import { FredTyping } from "@/features/ask-fred/components/FredTyping";
import { copyText } from "@/features/ask-fred/components/utils";
import { createStyles } from "@/styles";
import type { FredReactMessage } from "@firefliesai/fred-react";
import type { FC } from "react";
import { View } from "react-native";
import { getQueryText } from "../helpers/getQueryText";

export const AskFredOMessage: FC<{ message: FredReactMessage }> = ({
  message,
}) => {
  const queryText = getQueryText(message.query);
  const answerNodes = message.answerNodes ?? [];
  const isWaiting = message.status === "processing" && !answerNodes.length;

  return (
    <View style={styles.root}>
      {!!queryText && (
        <AskFredUserMessageBubble
          accessibilityLabel={queryText}
          variant="global"
          onLongPress={() => copyText(queryText)}
        >
          <Text color="textSecondary" variant="body2Regular">
            {queryText}
          </Text>
        </AskFredUserMessageBubble>
      )}

      <AskFredResponseBubble variant="global">
        <View style={styles.answerContent}>
          {answerNodes}
          {isWaiting && <FredTyping />}
          {message.status === "failed" && (
            <Text color="informationStaticRedText" variant="body2Regular">
              {message.error || "Something went wrong. Please try again."}
            </Text>
          )}
          {message.status === "cancelled" && (
            <Text color="textHint" variant="body2Regular">
              Response cancelled
            </Text>
          )}
        </View>
      </AskFredResponseBubble>
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "column",
    gap: 8,
    paddingBottom: 20,
  },
  answerContent: {
    width: "100%",
    flexDirection: "column",
    gap: 2,
  },
});

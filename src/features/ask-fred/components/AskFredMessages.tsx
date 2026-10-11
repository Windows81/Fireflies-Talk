import { useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { AskFredEmptyState } from "./AskFredEmptyState";
import { AskFredResponseFredMessage } from "./AskFredResponseFredMessage";
import { AskFredUserMessageBubble } from "./AskFredUserMessageBubble";
import { copyText } from "./utils";
import { useThread } from "@firefliesai/fred-react";
import { getQueryText, formatAnswerParts } from "../utils/message-helpers";
import { ASK_FRED_LOADING_ANSWER } from "../constants/config";
import type { AskFredSubmitParams } from "../types/askFred";

export const AskFredMessages: FC<{
  meeting: Pick<Meeting, "id">;
  promptSuggestions?: string[];
  emptyState?: ReactNode;
  submitParams?: AskFredSubmitParams;
  // Render the empty state (with its placeholder suggestions) instead of a
  // spinner while the thread history loads, for a calmer first paint.
  showEmptyStateWhileLoading?: boolean;
}> = ({
  meeting,
  promptSuggestions,
  emptyState,
  submitParams,
  showEmptyStateWhileLoading = false,
}) => {
  const ref = useRef<ScrollView>(null);
  const { messages = [], isLoading } = useThread();

  useEffect(() => {
    ref.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const noMessages = messages.length === 0;
  const showEmptyState =
    noMessages && (showEmptyStateWhileLoading || !isLoading);

  return (
    <ScrollView
      ref={ref}
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        showEmptyState && styles.centered,
      ]}
    >
      {messages.length > 0 ? (
        <>
          {messages.map((message, index) => {
            // Extract text content once for each part
            const queryText = getQueryText(message.query);
            const answerText = formatAnswerParts(message.answer);

            return (
              <View key={message.id ?? String(index)} style={styles.qa}>
                {/* User Query */}
                {queryText && (
                  <AskFredUserMessageBubble
                    accessibilityLabel={queryText}
                    onLongPress={() => copyText(queryText)}
                  >
                    <Text color="textSecondary" variant="body2Regular">
                      {queryText}
                    </Text>
                  </AskFredUserMessageBubble>
                )}

                {/* Assistant Answer */}
                {answerText && (
                  <AskFredResponseFredMessage
                    answer={answerText}
                    meeting={meeting}
                  />
                )}
              </View>
            );
          })}

          {/* Show loading indicator at the bottom when new message is being processed */}
          {isLoading && (
            <View style={styles.qa}>
              <AskFredResponseFredMessage
                answer={ASK_FRED_LOADING_ANSWER}
                meeting={meeting}
              />
            </View>
          )}
        </>
      ) : showEmptyState ? (
        (emptyState ?? (
          <AskFredEmptyState
            meeting={meeting}
            promptSuggestions={promptSuggestions}
            submitParams={submitParams}
          />
        ))
      ) : (
        // Only reached when a spinner is preferred over the empty state.
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      )}
    </ScrollView>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  qa: {
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

import { createStyles } from "@/styles";
import { useThread } from "@firefliesai/fred-react";
import type { FC } from "react";
import { ScrollView } from "react-native";
import { useStickToBottom } from "../hooks/useStickToBottom";
import { AskFredOEmptyState } from "./AskFredOEmptyState";
import { AskFredOMessage } from "./AskFredOMessage";

export const AskFredOMessageList: FC = () => {
  const { messages } = useThread();
  const { scrollRef, onScroll, onContentSizeChange } = useStickToBottom();

  if (!messages.length) return <AskFredOEmptyState />;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentContainerStyle={styles.content}
      onScroll={onScroll}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={64}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((message) => (
        <AskFredOMessage key={message.id} message={message} />
      ))}
    </ScrollView>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
  },
});

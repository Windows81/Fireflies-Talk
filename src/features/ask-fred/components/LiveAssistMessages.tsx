import {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
  type RefObject,
} from "react";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { Pressable, FlatList, View, type ListRenderItem } from "react-native";
import { LiveAssistEmptyState } from "./LiveAssistEmptyState";
import { AskFredResponseFredMessage } from "./AskFredResponseFredMessage";
import { AskFredAnswerLoader } from "./AskFredAnswerLoader";
import { LiveAssistFollowUp } from "./LiveAssistFollowUp";
import { copyText } from "./utils";
import { useThread } from "@firefliesai/fred-react";
import { useAssistThread } from "../providers/AssistThreadContext";
import type { ThreadMessage } from "@firefliesai/fred-client";
import {
  getTextContent,
  getTemplateTooltipContent,
  parseUserDisplayContent,
} from "../utils/message-helpers";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import { useOptionalLiveScreenContext } from "@/screens/Live/Context/LiveScreenContext";

const logger = new Logger("LiveAssistMessages");

// Helpers are now imported from centralized utils/message-helpers

type MessageItem =
  | {
      type: "message";
      message: ThreadMessage;
      index: number;
      isLastMessage: boolean;
    }
  | {
      type: "loading";
    };

export const LiveAssistMessages: FC<{
  meeting: Meeting;
  promptSuggestions?: string[] | null;
  containerRef?: RefObject<View | null>;
}> = ({ meeting, promptSuggestions, containerRef }) => {
  const theme = useTheme();
  // Opened from the Record screen there is no LiveScreenProvider — the
  // meeting being recorded is by definition still live.
  const isMeetingEnded =
    useOptionalLiveScreenContext()?.isMeetingEnded ?? false;
  const ref = useRef<FlatList>(null);
  const { messages } = useThread();
  const { hasOptimisticMessage } = useAssistThread();

  // Auto-scroll: keep question pinned at top during streaming, stop on manual scroll
  const autoScrollEnabled = useRef(true);
  const prevMessageCount = useRef(messages?.length ?? 0);
  const hasCompletedInitialScrollRef = useRef((messages?.length ?? 0) === 0);
  const pendingFollowUpScrollRef = useRef(false);
  const wrapperRef = useRef<View>(null);
  const [hideUntilInitialScroll, setHideUntilInitialScroll] = useState(
    (messages?.length ?? 0) > 0,
  );

  // Detect user-initiated scrolls via native wheel event (mouse wheel / trackpad)
  // Unlike onScroll, the wheel event only fires from real user interaction, never programmatic scrolls
  useEffect(() => {
    const node = wrapperRef.current as unknown as HTMLElement;
    if (!node?.addEventListener) return;

    const handleWheel = () => {
      autoScrollEnabled.current = false;
    };

    node.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      node.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const renderItem: ListRenderItem<MessageItem> = useCallback(
    ({ item }) => {
      if (item.type === "loading") {
        return (
          <View style={styles.loadingContainer}>
            <AskFredAnswerLoader isLiveMeeting={true} />
          </View>
        );
      }

      // Message item
      const { message, isLastMessage } = item;

      // Extract user question and assistant answer using proper fred-react message structure
      const userQuery = getTextContent(message.query);
      const assistantAnswer = getTextContent(message.answer);

      // Clean user query to remove context/template markers for display
      const displayQuery = userQuery ? parseUserDisplayContent(userQuery) : "";
      const rawTooltip = userQuery ? getTemplateTooltipContent(userQuery) : "";
      const templateTooltip =
        rawTooltip.length > 100 ? rawTooltip.slice(0, 100) + "..." : rawTooltip;

      const hasAnswer = Boolean(assistantAnswer);
      const suggestedQueries = message.suggestedQueries;

      const questionBubble = (
        <HoverTooltip
          disabled={!templateTooltip}
          label={templateTooltip}
          position="bottom"
          align="end"
        >
          <Pressable
            style={styles.question(theme)}
            disabled={!templateTooltip}
            onLongPress={() => {
              copyText(displayQuery, false, containerRef);
            }}
          >
            <>
              <Text color="textPrimary" variant="body2Regular">
                {displayQuery}
              </Text>
            </>
          </Pressable>
        </HoverTooltip>
      );

      return (
        <View style={styles.messageGroup}>
          {/* User Question */}
          {displayQuery && <View style={styles.qa}>{questionBubble}</View>}

          {/* Assistant Answer */}
          {assistantAnswer && (
            <View style={styles.qa}>
              <AskFredResponseFredMessage
                answer={assistantAnswer}
                meeting={meeting}
                containerRef={containerRef}
              />
            </View>
          )}

          {/* Follow Up Section - Only show for last message with an answer */}
          {isLastMessage && hasAnswer && !hasOptimisticMessage && (
            <LiveAssistFollowUp
              meeting={meeting}
              lastMessageId={message.id}
              suggestedQueries={suggestedQueries}
            />
          )}
        </View>
      );
    },
    [meeting, hasOptimisticMessage, theme, containerRef],
  );

  // Create data array for FlatList
  const data: MessageItem[] = useMemo(() => {
    const items: MessageItem[] = [];

    if (messages && messages.length > 0) {
      messages.forEach((message, index) => {
        items.push({
          type: "message",
          message,
          index,
          isLastMessage: index === messages.length - 1,
        });
      });

      // Add loading state if optimistic message
      if (hasOptimisticMessage) {
        items.push({ type: "loading" });
      }
    }

    return items;
  }, [messages, hasOptimisticMessage]);

  const followUpSignature = useMemo(() => {
    if (!messages || messages.length === 0 || hasOptimisticMessage) return "";
    const lastMessage = messages[messages.length - 1];
    const suggestedQueries = lastMessage.suggestedQueries ?? [];
    if (!getTextContent(lastMessage.answer) || suggestedQueries.length === 0) {
      return "";
    }
    return `${lastMessage.id || messages.length}:${suggestedQueries.join("|")}`;
  }, [messages, hasOptimisticMessage]);

  const keyExtractor = useCallback((item: MessageItem, index: number) => {
    if (item.type === "message") {
      return item.message.id || `message-${item.index}`;
    }
    return `${item.type}-${index}`;
  }, []);

  const scrollToEndForFollowUp = useCallback(() => {
    if (!autoScrollEnabled.current) return;
    ref.current?.scrollToEnd({ animated: true });
    setTimeout(() => {
      if (!autoScrollEnabled.current) return;
      ref.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  const maybeCompleteInitialScroll = useCallback(() => {
    if (hasCompletedInitialScrollRef.current || data.length === 0) return false;
    ref.current?.scrollToEnd({ animated: false });
    hasCompletedInitialScrollRef.current = true;
    setHideUntilInitialScroll(false);
    return true;
  }, [data.length]);

  const handleContentSizeChange = useCallback(() => {
    if (maybeCompleteInitialScroll()) return;

    if (pendingFollowUpScrollRef.current) {
      pendingFollowUpScrollRef.current = false;
      scrollToEndForFollowUp();
    }
  }, [maybeCompleteInitialScroll, scrollToEndForFollowUp]);

  useEffect(() => {
    if (data.length === 0 || hasCompletedInitialScrollRef.current) return;
    setHideUntilInitialScroll(true);
    const timeout = setTimeout(maybeCompleteInitialScroll, 50);
    return () => clearTimeout(timeout);
  }, [data.length, maybeCompleteInitialScroll]);

  // Re-enable auto-scroll when a new question is submitted (message count increases)
  useEffect(() => {
    const messageCount = messages?.length ?? 0;
    if (messageCount > prevMessageCount.current) {
      autoScrollEnabled.current = true;
    }
    prevMessageCount.current = messageCount;
  }, [messages?.length]);

  // Keep the question pinned at the top while the answer streams in
  useEffect(() => {
    if (!autoScrollEnabled.current) return;
    if (!hasCompletedInitialScrollRef.current) return;
    if (!messages || messages.length === 0) return;

    const lastMessageIndex = data.findIndex(
      (item, index) =>
        item.type === "message" &&
        index === data.length - (hasOptimisticMessage ? 2 : 1),
    );

    if (lastMessageIndex !== -1 && ref.current) {
      setTimeout(() => {
        if (!autoScrollEnabled.current) return;
        try {
          ref.current?.scrollToIndex({
            index: lastMessageIndex,
            animated: true,
            viewPosition: 0,
          });
        } catch (error) {
          logger.warn("scrollToIndex failed, using scrollToEnd", { error });
          ref.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages, hasOptimisticMessage, data]);

  useEffect(() => {
    if (!followUpSignature || !hasCompletedInitialScrollRef.current) return;

    pendingFollowUpScrollRef.current = true;
    const timeout = setTimeout(() => {
      if (!pendingFollowUpScrollRef.current) return;
      pendingFollowUpScrollRef.current = false;
      scrollToEndForFollowUp();
    }, 50);

    return () => clearTimeout(timeout);
  }, [followUpSignature, scrollToEndForFollowUp]);

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      logger.warn("ScrollToIndex failed, retrying", info);

      // Wait for layout to complete, then try scrolling to end
      setTimeout(() => {
        ref.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [],
  );

  return (
    <View
      ref={wrapperRef}
      style={[styles.root, hideUntilInitialScroll && styles.initiallyHidden]}
    >
      <FlatList
        ref={ref}
        style={styles.root}
        contentContainerStyle={styles.content}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onContentSizeChange={handleContentSizeChange}
        onScrollBeginDrag={() => {
          autoScrollEnabled.current = false;
        }}
        removeClippedSubviews={false}
        windowSize={5}
        ListEmptyComponent={
          <LiveAssistEmptyState
            promptSuggestions={!isMeetingEnded ? promptSuggestions : undefined}
            meeting={meeting}
          />
        }
      />

      {isMeetingEnded && messages && messages.length > 0 && (
        <LiveAssistEmptyState meeting={meeting} compact />
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  initiallyHidden: {
    opacity: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  messageGroup: {
    marginBottom: 16,
    gap: 12,
  },
  qa: {
    marginBottom: 4,
  },
  question: (theme) => ({
    backgroundColor: isDesktop
      ? theme.colors.interactiveSecondaryHover
      : theme.colors.layerSubtle,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: "auto",
    maxWidth: "85%",
  }),
  loadingContainer: {
    paddingHorizontal: 8,
    marginBottom: 20,
  },
});

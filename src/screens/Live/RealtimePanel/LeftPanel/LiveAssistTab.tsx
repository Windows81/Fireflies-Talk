import { ShimmerText, Text } from "@/components/Typography";
import { useAssistThread } from "@/features/ask-fred";
import { ASKFRED_SUGGESTION_SOURCE } from "@/features/ask-fred/constants/config";
import { parseUserDisplayContent } from "@/features/ask-fred/utils/message-helpers";
import { useAuth } from "@/features/auth";
import { useBilling } from "@/features/billing";
import type { Meeting } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { AskFredPaywallModal } from "src/features/ask-fred/AskFredPaywall";
import { ASSIST_MODES } from "src/features/live/types";
import { ThreeDotBouncingAnim } from "../../components/ThreeDotBouncing";
import { useLiveScreenContext } from "../../Context/LiveScreenContext";
import { AssistModeSelector } from "../../Notes/AssistModeSelector";
import { DEFAULT_SUGGESTIONS_FOR_FREE_USERS } from "../../Notes/LiveAssistSection";
import { LiveAssistGridCard } from "./LiveAssistGridCard";
import { SuggestionCard } from "./SuggestionCard";

const RTP_LABEL_OVERRIDES: Record<string, string> = {
  "Suggest questions": "Follow up questions",
};

interface CardAction {
  emoji: string;
  title: string;
  description: string;
  submitPrompt: string;
}

export const LiveAssistTab: FC<{
  meeting: Meeting;
  onAskFredPrompt: () => void;
}> = ({ meeting, onAskFredPrompt }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const { askFred, isAnyAssistLoading, setAssistPanelOpen } = useAssistThread();
  const { isAllowedToUsePrompts } = useBilling();
  const {
    assistActions,
    assistMode,
    markDynamicActionAsClicked,
    entitiesDetected,
    recordingContext,
  } = useLiveScreenContext();

  const isDemo = recordingContext?.isDemo;
  const isGeneralAssist = assistMode === ASSIST_MODES.GENERAL;
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // General Assist always offers the four predefined questions (mirrors the
  // live bar icons/prompts). Clicking one sends its prompt to AskFred.
  const defaultSuggestions = useMemo(
    () =>
      DEFAULT_SUGGESTIONS_FOR_FREE_USERS(theme, user?.name ?? undefined).map(
        (action) => {
          if (typeof action.label !== "string") return action;
          return {
            ...action,
            label: RTP_LABEL_OVERRIDES[action.label] ?? action.label,
          };
        },
      ),
    [theme, user?.name],
  );

  const cardActions = useMemo<CardAction[]>(() => {
    const modeActions = assistActions.filter(
      (action) => action.assistMode === assistMode,
    );
    const limited = modeActions.slice(
      assistMode === ASSIST_MODES.GENERAL ? -3 : 0,
    );
    return limited
      .filter((action) => (action.suggestion ?? "").trim() !== "")
      .map((action) => ({
        emoji: action.emoji,
        title: action.title ?? action.suggestion.split("\n\n")[0] ?? "",
        description: action.suggestion,
        submitPrompt: action.question || action.suggestion,
      }));
  }, [assistActions, assistMode]);

  const latestUnansweredQuestion = useMemo(() => {
    if (assistMode !== ASSIST_MODES.SALES) return null;
    const modeActions = assistActions.filter(
      (action) => action.assistMode === assistMode,
    );
    return [...modeActions]
      .reverse()
      .find(
        (action) =>
          action.question != null &&
          action.question.trim() !== "" &&
          !action.suggestion,
      );
  }, [assistActions, assistMode]);

  const sendPrompt = async (submitPrompt: string, isDynamic: boolean) => {
    if (isAnyAssistLoading) return;
    if (!isAllowedToUsePrompts && !isDemo) {
      setIsPaywallOpen(true);
      return;
    }

    setAssistPanelOpen(true);
    onAskFredPrompt();
    if (!submitPrompt) return;

    if (assistMode === ASSIST_MODES.GENERAL) {
      tracker.track(TRACKING_EVENTS.GENERAL_ASSIST_SUGGESTION_CLICKED, {
        meetingId: meeting.id,
        isDynamic,
      });
    }

    if (isDynamic) {
      markDynamicActionAsClicked(parseUserDisplayContent(submitPrompt));
    }

    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId: meeting.id,
      queryLength: submitPrompt.length,
      isSuggestedPrompt: true,
      isDynamic,
      assistMode,
    });

    await askFred(submitPrompt, ASKFRED_SUGGESTION_SOURCE.LIVE_ASSIST_ACTIONS);
  };

  // Collapsed cards expand on press; expanded cards trigger the prompt.
  const expandCard = (key: string) => {
    setExpandedKeys((prev) => new Set(prev).add(key));
  };

  const askFredFromKbFallback = async () => {
    const question = latestUnansweredQuestion?.question?.trim();
    if (!question) return;
    tracker.track(TRACKING_EVENTS.SALES_ASSIST_KB_FALLBACK_CLICKED, {
      meetingId: meeting.id,
    });
    const prompt = `[CONTEXT_START] Search for the answer in previous meetings or the Fireflies knowledge base. [CONTEXT_END] ${question}`;
    await sendPrompt(prompt, false);
  };

  return (
    <>
      <AskFredPaywallModal
        isOpen={isPaywallOpen}
        close={() => setIsPaywallOpen(false)}
        from={ASKFRED_SUGGESTION_SOURCE.LIVE_ASSIST_ACTIONS}
      />
      <View style={styles.root}>
        <AssistModeSelector showCreditsHint={false} />
        {isGeneralAssist ? (
          <View style={styles.drawer}>
            <View style={styles.suggestionsWrapper}>
              <View style={styles.grid}>
                {[
                  defaultSuggestions.slice(0, 2),
                  defaultSuggestions.slice(2, 4),
                ].map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.gridRow}>
                    {row.map((action, colIndex) => (
                      <LiveAssistGridCard
                        key={`${rowIndex}-${colIndex}`}
                        action={action}
                        disabled={isAnyAssistLoading}
                        onPress={() => sendPrompt(action.suggestion, false)}
                      />
                    ))}
                  </View>
                ))}
              </View>
              {cardActions.length > 0 && (
                <View style={styles.dynamicList}>
                  {cardActions.map((action, index) => (
                    <SuggestionCard
                      key={`dynamic-${index}`}
                      emoji={action.emoji}
                      title={action.title}
                      description=""
                      isExpanded={false}
                      isDisabled={isAnyAssistLoading}
                      onToggle={() => sendPrompt(action.submitPrompt, true)}
                    />
                  ))}
                </View>
              )}
            </View>
            <View style={styles.listeningRow}>
              <ThreeDotBouncingAnim showMessages={false} renderAnimImmediate />
              <Text variant="body2Regular" color="textMuted">
                Live Assist listening
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.salesContent}>
            <View style={styles.dynamicList}>
              {cardActions.map((action, index) => {
                const key = `${parseUserDisplayContent(action.title)}-${index}`;
                const isExpanded = expandedKeys.has(key);
                return (
                  <SuggestionCard
                    key={key}
                    emoji={action.emoji}
                    title={action.title}
                    description={action.description}
                    isExpanded={isExpanded}
                    isDisabled={isAnyAssistLoading}
                    onToggle={() =>
                      isExpanded
                        ? sendPrompt(action.submitPrompt, true)
                        : expandCard(key)
                    }
                  />
                );
              })}
            </View>
            {(entitiesDetected != null || latestUnansweredQuestion != null) && (
              <View style={styles.detectedRow}>
                {entitiesDetected != null && (
                  <ShimmerText
                    variant="body3Regular"
                    color="textSecondary"
                    once
                  >
                    {`${entitiesDetected.count} Question${
                      entitiesDetected.count > 1 ? "s" : ""
                    } detected`}
                  </ShimmerText>
                )}
                {latestUnansweredQuestion != null && (
                  <View style={styles.kbFallbackRow}>
                    <Text variant="body3Regular" color="commandNeutralDisabled">
                      {`'${latestUnansweredQuestion.title ?? "Item"}' not found in KB — try `}
                    </Text>
                    <Pressable
                      onPress={askFredFromKbFallback}
                      accessibilityRole="button"
                      accessibilityLabel="Try AskFred"
                      hitSlop={8}
                    >
                      <Text
                        variant="body3Regular"
                        color="textMuted"
                        style={styles.askFredLink}
                      >
                        AskFred
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </>
  );
};

const styles = createStyles({
  root: {
    gap: 24,
  },
  drawer: {
    gap: 20,
  },
  suggestionsWrapper: {
    gap: 12,
  },
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  dynamicList: {
    gap: 12,
  },
  salesContent: {
    gap: 16,
  },
  listeningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 8,
    rowGap: 4,
  },
  kbFallbackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  askFredLink: {
    textDecorationLine: "underline",
    cursor: "pointer",
  },
});

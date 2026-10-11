import {
  IconAiExpand,
  IconCheckSquare,
  IconClock,
  IconComment,
  IconMessageCircle,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import {
  GeneralAssistPromotionalCard,
  LiveAssistPaywall,
  useIsLiveAssistPaywalled,
} from "@/components/Paywall";
import { ShimmerText, Text } from "@/components/Typography";
import { useAssistThread } from "@/features/ask-fred";
import { useAuth } from "@/features/auth";
import { useBilling } from "@/features/billing";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isDesktop } from "@/utils/device";
import { ASKFRED_SUGGESTION_SOURCE } from "@/features/ask-fred/constants/config";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AskFredPaywallModal } from "src/features/ask-fred/AskFredPaywall";
import { ASSIST_MODES } from "src/features/live/types";
import { useLiveScreenContext } from "../Context/LiveScreenContext";
import { ThreeDotBouncingAnim } from "../components/ThreeDotBouncing";
import {
  DynamicAssistActionItem,
  type AssistAction,
} from "./DynamicAssistActionItem";
import { FeedbackModal } from "@/screens/Feedback";

// Remove context markers from user-facing suggestion text
const parseUserDisplayContent = (query?: string | null): string => {
  if (!query) return "";
  const withoutContext = query.replace(
    /\[CONTEXT_START\][\s\S]*?\[CONTEXT_END\]/g,
    "",
  );
  return withoutContext.trim();
};

interface LiveAssistSectionProps {
  meeting: Meeting;
  compactMode?: boolean;
}

export const DEFAULT_SUGGESTIONS_FOR_FREE_USERS = (
  theme: ReturnType<typeof useTheme>,
  userName?: string,
): AssistAction[] => [
  {
    label: "Suggest questions",
    suggestion: `Suggest follow-up questions [CONTEXT_START] Based strictly on the last 1-2 minutes of conversation, generate 1–3 short, natural, and contextually relevant follow-up questions that ${userName} could ask next.[CONTEXT_END]`,
    emoji: "❓",
    reasoning: "This is a default action that is always present",
    Icon: () => (
      <IconComment
        width={16}
        height={16}
        color={theme.colors.rainbowStaticOrangeSolid}
      />
    ),
  },
  {
    label: "Catch up (Last 1 min)",
    suggestion:
      "Catch me up on last 1 min conversation [CONTEXT_START] Give a brief summary based only on the last 1-2 min of conversation in bullet points. Base the summary strictly on the provided conversation context. Do not infer or add new information. [CONTEXT_END]",
    emoji: "⏳",
    reasoning: "This is a default action that is always present",
    Icon: () => (
      <IconClock
        width={16}
        height={16}
        stroke={theme.colors.rainbowStaticPinkSolid}
      />
    ),
  },
  {
    label: "Summarize so far",
    suggestion:
      "Summarize so far [CONTEXT_START] Give a brief summary of the meeting so far in bullet points and main points. [CONTEXT_END]",
    emoji: "📝",
    reasoning: "This is a default action that is always present",
    Icon: () => (
      <IconAiExpand
        width={20}
        height={20}
        color={theme.colors.rainbowStaticIndigoSolid}
      />
    ),
  },
  {
    label: "Action items",
    suggestion:
      "List out action items [CONTEXT_START] List out action items and for each action item, clearly state what needs to be done, who is responsible (if mentioned), and the deadline or timeframe (if mentioned). [CONTEXT_END]",
    emoji: "☑️",
    reasoning: "This is a default action that is always present",
    Icon: () => (
      <IconCheckSquare
        width={16}
        height={16}
        stroke={theme.colors.rainbowStaticTealSolid}
      />
    ),
  },
];

const renderDefaultAction = (
  action: AssistAction,
  index: number,
  theme: ReturnType<typeof useTheme>,
  handleActionPress: (action: AssistAction, isDynamic?: boolean) => void,
  isDisabled: boolean,
) => {
  const parsedSuggestion = parseUserDisplayContent(action.suggestion);
  const actionKey = `default-${parsedSuggestion}-${index}`;

  return (
    <View key={actionKey} style={styles.gridItem(theme)}>
      <Button
        variant="transparentPrimary"
        style={styles.defaultSuggestionCard}
        onPress={() => handleActionPress(action)}
        disabled={isDisabled}
      >
        {action.Icon ? (
          <action.Icon />
        ) : (
          <Text style={styles.defaultEmoji}>{action.emoji}</Text>
        )}
        <Text
          color="textSecondary"
          variant="body2Regular"
          style={styles.defaultSuggestionText}
        >
          {action.label || parsedSuggestion}
        </Text>
      </Button>
    </View>
  );
};

export const LiveAssistSection: FC<LiveAssistSectionProps> = ({
  meeting,
  compactMode,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { askFred, isAnyAssistLoading, setAssistPanelOpen } = useAssistThread();

  const {
    assistActions,
    assistMode,
    clickedDynamicActions,
    markDynamicActionAsClicked,
    showSalesAssistPaywall,
    entitiesDetected,
    recordingContext,
  } = useLiveScreenContext();

  const isDemo = recordingContext?.isDemo;

  const scrollViewRef = useRef<ScrollView>(null);
  const { isAllowedToUsePrompts, isFreeUser } = useBilling();
  const isPaywalled = useIsLiveAssistPaywalled({
    assistMode,
    isDemo,
    showSalesAssistPaywall,
  });
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const onModalClose = () => setIsFeedbackModalOpen(false);

  // Get assist mode display name
  const assistModeName =
    assistMode === ASSIST_MODES.SALES ? "Sales Assist" : "Live Assist";

  const limitedAssistActions = assistActions
    .filter((action) => action.assistMode === assistMode)
    .slice(assistMode === ASSIST_MODES.GENERAL ? -3 : 0);

  const salesAssistCards =
    assistMode === ASSIST_MODES.SALES
      ? limitedAssistActions.filter(
          (a) => a.suggestion && a.suggestion.trim() !== "",
        )
      : limitedAssistActions;

  const latestQuestionItem = useMemo(() => {
    return assistMode === ASSIST_MODES.SALES
      ? [...limitedAssistActions]
          .reverse()
          .find(
            (a) =>
              a.question != null && a.question.trim() !== "" && !a.suggestion,
          )
      : null;
  }, [assistMode, limitedAssistActions]);

  useEffect(() => {
    if (assistMode === ASSIST_MODES.SALES && salesAssistCards.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [assistMode, salesAssistCards.length]);

  const handleLastItemExpand = () => {
    if (assistMode === ASSIST_MODES.SALES) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  const [isOpenPaywall, setIsOpenPaywall] = useState(false);

  const handleActionPress = async (
    action: AssistAction,
    isDynamic?: boolean,
  ) => {
    if (isAnyAssistLoading) {
      return;
    }

    if (!isAllowedToUsePrompts && !isDemo) {
      setIsOpenPaywall(true);
      return;
    }

    setAssistPanelOpen(true);

    const prompt = action.submitPrompt ?? action.suggestion;
    if (!prompt) return;

    if (assistMode === ASSIST_MODES.GENERAL) {
      tracker.track(TRACKING_EVENTS.GENERAL_ASSIST_SUGGESTION_CLICKED, {
        meetingId: meeting.id,
        isDynamic: !!isDynamic,
      });
    }

    // Mark dynamic action as clicked
    if (isDynamic) {
      const actionKey = parseUserDisplayContent(prompt);
      markDynamicActionAsClicked(actionKey);
    }

    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId: meeting.id,
      queryLength: prompt.length,
      isSuggestedPrompt: true,
      isDynamic,
      assistMode,
    });

    await askFred(prompt, ASKFRED_SUGGESTION_SOURCE.LIVE_ASSIST_ACTIONS);
  };

  if (isPaywalled) {
    return (
      <LiveAssistPaywall assistMode={assistMode} compactMode={compactMode} />
    );
  }

  return (
    <>
      <AskFredPaywallModal
        isOpen={isOpenPaywall}
        close={() => setIsOpenPaywall(false)}
        from={ASKFRED_SUGGESTION_SOURCE.LIVE_ASSIST_ACTIONS}
      />
      <View style={styles.suggestions}>
        {assistMode === ASSIST_MODES.GENERAL && (
          <View style={styles.defaultActionsGrid}>
            {DEFAULT_SUGGESTIONS_FOR_FREE_USERS(theme, user?.name).map(
              (action, index) =>
                renderDefaultAction(
                  action,
                  index,
                  theme,
                  handleActionPress,
                  isAnyAssistLoading,
                ),
            )}
          </View>
        )}
        {assistMode === ASSIST_MODES.GENERAL &&
          isFreeUser &&
          isDesktop &&
          !isDemo && <GeneralAssistPromotionalCard />}
        {assistMode === ASSIST_MODES.SALES ? (
          <>
            <View>
              <ScrollView
                ref={scrollViewRef}
                style={[styles.scrollableContainer]}
                contentContainerStyle={styles.scrollableContent}
                showsVerticalScrollIndicator={false}
              >
                {salesAssistCards.map((action, index) => {
                  const displayTitle =
                    action.title ?? action.suggestion?.split("\n\n")[0] ?? "";
                  const displayBody =
                    action.suggestion || action.question || "";
                  const submitPrompt =
                    action.question || action.suggestion || "";
                  const actionKey = parseUserDisplayContent(
                    action.title ?? submitPrompt,
                  );
                  const isClicked = clickedDynamicActions.has(actionKey);
                  return (
                    <DynamicAssistActionItem
                      key={`dynamic-${actionKey}-${index}`}
                      action={{
                        ...action,
                        suggestion: displayTitle,
                        subSection:
                          displayBody.trim() !== "" ? displayBody : undefined,
                        submitPrompt,
                      }}
                      index={index}
                      handleActionPress={handleActionPress}
                      isDisabled={isAnyAssistLoading}
                      assistMode={assistMode}
                      theme={theme}
                      isClicked={isClicked}
                      isLastItem={index === salesAssistCards.length - 1}
                      onExpand={handleLastItemExpand}
                      compactMode={compactMode}
                      totalCount={salesAssistCards.length}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </>
        ) : (
          limitedAssistActions.map((action, index) => {
            const actionKey = parseUserDisplayContent(action.suggestion);
            const isClicked = clickedDynamicActions.has(actionKey);

            return (
              <>
                {index === 0 && <View style={{ marginTop: 6 }} />}
                <DynamicAssistActionItem
                  key={`dynamic-${actionKey}-${index}`}
                  action={action}
                  index={index}
                  handleActionPress={handleActionPress}
                  isDisabled={isAnyAssistLoading}
                  isClicked={isClicked}
                  assistMode={assistMode}
                  theme={theme}
                  totalCount={limitedAssistActions.length}
                />
              </>
            );
          })
        )}
        <View
          style={
            isFreeUser && !isDemo
              ? styles.bottomContainerReversed
              : styles.bottomContainer
          }
        >
          {(!isFreeUser || isDemo) && (
            <View style={styles.threeDotBouncingContainer}>
              <ThreeDotBouncingAnim
                showMessages={false}
                renderAnimImmediate={true}
              />
              {!entitiesDetected ? (
                <Text>
                  <Text variant="body2Weight" color="textMuted">
                    {assistModeName}
                  </Text>
                  <ShimmerText variant="body2Regular" color="textHint">
                    {" "}
                    is listening
                  </ShimmerText>
                </Text>
              ) : (
                <ShimmerText variant="body2Weight" color="textSecondary">
                  {`${entitiesDetected.count} Question${entitiesDetected.count > 1 ? "s" : ""} detected`}
                </ShimmerText>
              )}
            </View>
          )}

          {limitedAssistActions.length > 0 && (
            <>
              <Pressable
                style={styles.feedbackButton}
                onPress={() => setIsFeedbackModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Feedback"
              >
                <IconMessageCircle
                  width={16}
                  height={16}
                  color={theme.colors.textSecondary}
                  strokeWidth={2}
                />

                <Text variant="label3Regular" color="textSecondary">
                  Feedback
                </Text>
              </Pressable>
              <FeedbackModal
                isOpen={isFeedbackModalOpen}
                close={onModalClose}
                onShare={onModalClose}
                category={
                  assistMode === ASSIST_MODES.SALES
                    ? "Sales Assist (Desktop)"
                    : "General Assist (Desktop)"
                }
              />
            </>
          )}
        </View>
      </View>
      {latestQuestionItem != null && (
        <View
          style={styles.salesAssistFooter(theme)}
          key={latestQuestionItem.question}
        >
          <ShimmerText
            variant="body3Regular"
            color="commandNeutralDisabled"
            once
            duration={3000}
          >
            {`'${latestQuestionItem.title ?? "Item"}' `}
          </ShimmerText>
          <Text variant="body3Regular" color="commandNeutralDisabled">
            {`not found in KB — try `}
          </Text>
          <Pressable
            onPress={async () => {
              if (
                latestQuestionItem.question != null &&
                latestQuestionItem.question.trim() !== ""
              ) {
                const trimmedQuestion = latestQuestionItem.question.trim();
                tracker.track(
                  TRACKING_EVENTS.SALES_ASSIST_KB_FALLBACK_CLICKED,
                  {
                    meetingId: meeting.id,
                  },
                );
                const questionWithContext = `[CONTEXT_START] Search for the answer in previous meetings or the Fireflies knowledge base. [CONTEXT_END] ${trimmedQuestion}`;
                await handleActionPress({
                  suggestion: trimmedQuestion,
                  submitPrompt: questionWithContext,
                  reasoning: "",
                });
              }
            }}
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
    </>
  );
};

const styles = createStyles({
  title: {
    fontSize: 16,
  },
  suggestions: {
    gap: 6,
  },
  defaultActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridItem: (theme) => ({
    width: "49%",
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: theme.colors.borderInteractiveDefault,
  }),
  defaultSuggestionCard: {
    width: "100%",
  },
  defaultEmoji: {
    fontSize: 18,
  },
  defaultSuggestionText: {
    flex: 1,
    lineHeight: 18,
  },
  threeDotBouncingContainer: {
    marginLeft: 6,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomContainerReversed: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  scrollableContainer: {
    maxHeight: 280,
  },
  scrollableContent: {
    gap: 12,
  },
  salesAssistFooter: (theme) => ({
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStaticPage ?? "rgba(255, 255, 255, 0.1)",
  }),
  askFredLink: {
    textDecorationLine: "underline",
    cursor: "pointer",
  },
  dynamicActionContainer: (theme) => ({
    borderRadius: 9,
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
});

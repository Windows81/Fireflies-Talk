import { useBilling } from "@/features/billing";
import { isAskFredCreditsError } from "@/features/ask-fred/helpers/isAskFredCreditsError";
import { AskFredPaywallBanner, useAskFredPaywall } from "@/features/ask-fred";
import { useShakeAnimation } from "@/hooks/useShakeAnimation";
import { Logger } from "@/logger";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useThread } from "@firefliesai/fred-react";
import type { FC, ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ASK_FRED_O_PAYWALL, ASK_FRED_O_SOURCE } from "../constants";
import {
  createAskFredOSubmitParams,
  getAskFredOSubmitDecision,
  type AskFredOSubmissionSource,
} from "../helpers/askFredOSubmit";
import {
  hasAskFredOBillingAccessRecovered,
  type AskFredOBillingAccessSnapshot,
} from "../helpers/billingAccessRecovery";
import { ALL_CHANNELS, ANY_TIME } from "../helpers/toMeetingFilters";
import { useAskFredOScope } from "../providers/AskFredOScopeProvider";

const logger = new Logger("useAskFredOSubmit");

interface AskFredOSubmitContextValue {
  isInteractionBlocked: boolean;
  paywallBanner: ReactNode;
  submitQuestion: (
    question: string,
    submissionSource: AskFredOSubmissionSource,
  ) => Promise<boolean>;
  submitHitlResponse: (
    toolCallId: string,
    response: unknown,
    input: string,
  ) => Promise<boolean>;
}

const AskFredOSubmitContext = createContext<AskFredOSubmitContextValue | null>(
  null,
);

export const AskFredOSubmitProvider: FC<{
  children: ReactNode;
  isOpen: boolean;
}> = ({ children, isOpen }) => {
  const { submit, isLoading, setInput } = useThread();
  const { scope } = useAskFredOScope();
  const {
    aiExtensionsSubscription,
    hasLoaded,
    isAllowedToUsePrompts,
    isFreeUser,
    monthlyAICreditsLimit,
    monthlyAICreditsUsed,
    promptsLeft,
    refreshBilling,
  } = useBilling();
  const [forceCreditsPaywall, setForceCreditsPaywall] = useState(false);
  const forcedAtBilling = useRef<AskFredOBillingAccessSnapshot | null>(null);
  const paywall = useAskFredPaywall({
    ...ASK_FRED_O_PAYWALL,
    forceGated: forceCreditsPaywall,
    enabled: isOpen,
  });
  const { style: bannerStyle, shake } = useShakeAnimation();

  useEffect(() => {
    if (!isOpen) {
      forcedAtBilling.current = null;
      setForceCreditsPaywall(false);
      return;
    }
    if (
      forceCreditsPaywall &&
      forcedAtBilling.current &&
      hasAskFredOBillingAccessRecovered(forcedAtBilling.current, {
        isAllowed: isAllowedToUsePrompts,
        isFreeUser,
        promptsLeft,
        monthlyCreditsRemaining: Math.max(
          monthlyAICreditsLimit - monthlyAICreditsUsed,
          0,
        ),
        hasCreditsSubscription: !!aiExtensionsSubscription,
      })
    ) {
      forcedAtBilling.current = null;
      setForceCreditsPaywall(false);
    }
  }, [
    aiExtensionsSubscription,
    forceCreditsPaywall,
    isAllowedToUsePrompts,
    isFreeUser,
    isOpen,
    monthlyAICreditsLimit,
    monthlyAICreditsUsed,
    promptsLeft,
  ]);

  const handleCreditsError = useCallback(
    (error: unknown) => {
      if (!isAskFredCreditsError(error)) return;

      forcedAtBilling.current = {
        isAllowed: isAllowedToUsePrompts,
        isFreeUser,
        promptsLeft,
        monthlyCreditsRemaining: Math.max(
          monthlyAICreditsLimit - monthlyAICreditsUsed,
          0,
        ),
        hasCreditsSubscription: !!aiExtensionsSubscription,
      };
      setForceCreditsPaywall(true);
      void refreshBilling().catch((refreshError) => {
        logger.error("Failed to refresh billing after credits error:", {
          error: refreshError,
        });
      });
    },
    [
      aiExtensionsSubscription,
      isAllowedToUsePrompts,
      isFreeUser,
      monthlyAICreditsLimit,
      monthlyAICreditsUsed,
      promptsLeft,
      refreshBilling,
    ],
  );

  const submitQuestion = useCallback(
    async (rawQuestion: string, submissionSource: AskFredOSubmissionSource) => {
      const decision = getAskFredOSubmitDecision({
        hasLoadedBilling: hasLoaded,
        isAllowedToUsePrompts: isAllowedToUsePrompts && !forceCreditsPaywall,
        isLoading,
        question: rawQuestion,
      });

      if (decision === "blocked") {
        if (paywall) shake();
        return false;
      }
      if (decision === "ignored") return false;

      const question = rawQuestion.trim();
      if (submissionSource === "composer") setInput("");
      tracker.track(TRACKING_EVENTS.ASK_FRED_O_SUBMITTED, {
        submissionSource,
        scopeApplied:
          scope.range !== ANY_TIME || scope.channelId !== ALL_CHANNELS,
        queryLength: question.length,
      });

      try {
        await submit(createAskFredOSubmitParams(question));
        return true;
      } catch (error) {
        if (submissionSource === "composer") setInput(question);
        logger.error("Failed to submit AskFred-O question:", { error });
        handleCreditsError(error);
        return false;
      }
    },
    [
      forceCreditsPaywall,
      handleCreditsError,
      hasLoaded,
      isAllowedToUsePrompts,
      isLoading,
      paywall,
      scope.channelId,
      scope.range,
      setInput,
      shake,
      submit,
    ],
  );

  const submitHitlResponse = useCallback(
    async (toolCallId: string, response: unknown, input: string) => {
      const decision = getAskFredOSubmitDecision({
        hasLoadedBilling: hasLoaded,
        isAllowedToUsePrompts: isAllowedToUsePrompts && !forceCreditsPaywall,
        isLoading,
        question: input,
      });
      if (decision === "blocked") {
        if (paywall) shake();
        return false;
      }
      if (decision === "ignored") return false;

      tracker.track(TRACKING_EVENTS.ASK_FRED_O_SUBMITTED, {
        submissionSource: "hitl",
        scopeApplied:
          scope.range !== ANY_TIME || scope.channelId !== ALL_CHANNELS,
        queryLength: input.length,
      });

      try {
        await submit({
          source: ASK_FRED_O_SOURCE,
          hitlResponse: { toolCallId, response },
          input,
        });
        return true;
      } catch (error) {
        logger.error("Failed to answer Fred's question:", { error });
        handleCreditsError(error);
        return false;
      }
    },
    [
      forceCreditsPaywall,
      handleCreditsError,
      hasLoaded,
      isAllowedToUsePrompts,
      isLoading,
      paywall,
      scope.channelId,
      scope.range,
      shake,
      submit,
    ],
  );

  return (
    <AskFredOSubmitContext.Provider
      value={{
        isInteractionBlocked:
          isLoading ||
          !hasLoaded ||
          !isAllowedToUsePrompts ||
          forceCreditsPaywall,
        paywallBanner: paywall ? (
          <AskFredPaywallBanner paywall={paywall} style={bannerStyle} />
        ) : null,
        submitHitlResponse,
        submitQuestion,
      }}
    >
      {children}
    </AskFredOSubmitContext.Provider>
  );
};

export const useAskFredOSubmit = (): AskFredOSubmitContextValue => {
  const context = useContext(AskFredOSubmitContext);
  if (!context) {
    throw new Error("useAskFredOSubmit requires AskFredOSubmitProvider");
  }
  return context;
};

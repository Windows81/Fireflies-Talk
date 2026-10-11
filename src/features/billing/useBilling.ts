import type {
  AiExtensionsSubscription,
  TeamMinutesConsumed,
  TeamPromptsConsumed,
} from "@/graphql";
import { useGetCurrentUserQuery } from "@/graphql";
import { isFreeUser as checkIfUserIsFree } from "@firefliesai/payments-ff.utils";
import { useCallback, useMemo } from "react";
import { useAuth } from "../auth";
import { useTeam } from "../team";

const MICRO_CREDITS_MULTIPLIER = 1_000_000;

const FREE_MEETINGS_PER_TEAMMATE = 3;

const microCreditsToCredits = (microCredits: number): number => {
  return Math.floor(microCredits / MICRO_CREDITS_MULTIPLIER);
};

export const useBilling = (): {
  loading: boolean;
  /** True once the billing query has resolved at least once (cache or network). */
  hasLoaded: boolean;
  isFreeUser: boolean;
  teamPromptsConsumed?: TeamPromptsConsumed | null;
  isAllowedToUsePrompts: boolean;
  aiExtensionsSubscription?: AiExtensionsSubscription | null;
  teamMinutesConsumed?: TeamMinutesConsumed | null;
  reachedTeamMinutesConsumedLimit: boolean;
  freeMeetingsLeft?: number | null;
  /** Free meetings the whole team started with: three per active teammate. */
  freeMeetingsLimit: number;
  reachedFreeMeetingsLimit: boolean;
  hasPromptsLeft: boolean;
  promptsLeft: number;
  /** Effective monthly AI credits used (micro-credits based + granted) */
  monthlyAICreditsUsed: number;
  /** Effective monthly AI credits limit (base + granted) */
  monthlyAICreditsLimit: number;
  refreshBilling: () => Promise<void>;
} => {
  const { user } = useAuth();
  const { team } = useTeam();
  const { data, loading, refetch } = useGetCurrentUserQuery({
    fetchPolicy: "cache-and-network",
    skip: !user,
  });
  const refreshBilling = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const isFreeUser = !!user && checkIfUserIsFree(user.paidUser);
  const stripeData = data?.user?.teamStripeAccount?.[0];
  const aiCreditsCost = data?.user?.aiCreditsCost || 1;

  /**
   * AI Prompts
   */
  const aiExtensionsSubscription = stripeData?.aiExtensionsSubscription;
  const teamPromptsConsumed = data?.user?.teamPromptsConsumed;
  const isAllowedToUsePrompts = !!data?.user?.isAllowedToUsePrompts;

  const promptsLeft =
    (teamPromptsConsumed?.promptsLeft ?? 0) < 0
      ? 0
      : (teamPromptsConsumed?.promptsLeft ?? 0);
  const hasPromptsLeft = promptsLeft >= aiCreditsCost;

  /**
   * Effective AI credits using micro-credits + granted credits
   * (matches dashboard-ff AICreditsProvider logic).
   */
  const { monthlyAICreditsUsed, monthlyAICreditsLimit } = useMemo(() => {
    const grants = team?.grantedAICredits || [];
    const { totalAmount, totalUsed } = grants.reduce(
      (acc, grant) => ({
        totalAmount: acc.totalAmount + (grant.amount ?? 0),
        totalUsed: acc.totalUsed + (grant.amountUsed ?? 0),
      }),
      { totalAmount: 0, totalUsed: 0 },
    );
    const grantedCreditsLimit = microCreditsToCredits(totalAmount);
    const grantedCreditsUsed = microCreditsToCredits(totalUsed);

    const monthlyMicroCreditsUsed =
      teamPromptsConsumed?.monthlyMicroCreditsUsed || 0;
    const baseLimit = teamPromptsConsumed?.monthlyPromptsLimit || 0;

    const creditsUsed = microCreditsToCredits(monthlyMicroCreditsUsed);

    return {
      monthlyAICreditsUsed: creditsUsed + grantedCreditsUsed,
      monthlyAICreditsLimit: baseLimit + grantedCreditsLimit,
    };
  }, [teamPromptsConsumed, team?.grantedAICredits]);

  /**
   * Storage consumption in minutes
   */
  const teamMinutesConsumed = data?.user?.teamMinutesConsumed;
  const reachedTeamMinutesConsumedLimit = !!(
    teamMinutesConsumed &&
    !teamMinutesConsumed.isInfinity &&
    teamMinutesConsumed.minutesConsumed! >= teamMinutesConsumed.tierLimit!
  );

  /**
   * Number of transcription credits left
   */
  const freeMeetingsLeft = data?.user?.freeMeetingsLeft;
  // if freeMeetingsLeft is undefined, it means unlimited meetings
  const reachedFreeMeetingsLimit =
    typeof freeMeetingsLeft === "number" ? freeMeetingsLeft <= 0 : false;

  // The server reports what the whole team has left (it sums every unblocked
  // teammate's balance), so the limit has to be pooled the same way. Granted
  // credits can lift a balance above its share, hence the floor.
  const freeMeetingsLimit = useMemo(() => {
    const teammates =
      team?.teammates?.filter((teammate) => !teammate?.blocked).length || 1;
    return Math.max(
      FREE_MEETINGS_PER_TEAMMATE * teammates,
      freeMeetingsLeft ?? 0,
    );
  }, [team?.teammates, freeMeetingsLeft]);

  return {
    loading,
    hasLoaded: !!data?.user,
    isFreeUser,
    teamPromptsConsumed,
    isAllowedToUsePrompts,
    aiExtensionsSubscription,
    teamMinutesConsumed: data?.user?.teamMinutesConsumed,
    reachedTeamMinutesConsumedLimit,
    freeMeetingsLeft,
    freeMeetingsLimit,
    reachedFreeMeetingsLimit,
    promptsLeft,
    hasPromptsLeft,
    monthlyAICreditsUsed,
    monthlyAICreditsLimit,
    refreshBilling,
  };
};

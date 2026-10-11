import { useApolloClient } from "@apollo/client";
import {
  getTeamSize,
  getTier,
  SubscriptionPlan,
  type Teammate,
} from "@firefliesai/payments-ff.utils";
import { getUSStateFromZipCode } from "@firefliesai/shared-libs.utils";
import {
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";

import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import {
  GetCurrentUserDocument,
  GetTeamDocument,
  useCreateSubscriptionMutation,
  useGetCurrentUserQuery,
} from "@/graphql";
import { FREE_TRIAL_DAYS, type FreeTrialInterval } from "./constants";
import { useThreeDsCompletion } from "./useThreeDsCompletion";

interface UseStartFreeTrialArgs {
  trialPeriodDays?: number;
  /**
   * 'year' for annual (Business annual nickname), 'month' for monthly.
   * Falls back to `BUSINESS_FF` (annual) if the resolver receives an unmapped value.
   */
  interval?: FreeTrialInterval;
  paywall?: string;
  referral?: string;
  country?: string;
  onCompleted?: () => void;
}

interface SubmitArgs {
  /** Country code (ISO 3166-1 alpha-2). Required for tokenization. */
  country: string;
  /** Optional zip code; required for US. */
  zipCode?: string;
}

const getPlanNickname = (interval: FreeTrialInterval): string => {
  // Mirrors dashboard-ff's `getPriceFromInterval(tier, interval)` fallback for Business tier.
  return interval === "year"
    ? SubscriptionPlan.BUSINESS_FF_YEARLY
    : SubscriptionPlan.BUSINESS_FF;
};

/**
 *   1. Tokenize the credit card with Stripe Elements.
 *   2. Call `createSubscription`.
 *   3. Refetch user/team and complete.
 *
 * If the bank requires 3DS authentication, `createSubscription` returns
 * `{ is3ds: true, redirectUrl, subscription: null }` and we hand off to
 * `useThreeDsCompletion` for the redirect + polling dance.
 */
export function useStartFreeTrial({
  trialPeriodDays = FREE_TRIAL_DAYS,
  interval = "year",
  paywall,
  referral,
  onCompleted,
}: UseStartFreeTrialArgs = {}) {
  const stripe = useStripe();
  const stripeElements = useElements();
  const apollo = useApolloClient();
  const { user, updateUser } = useAuth();
  const { data: currentUserData } = useGetCurrentUserQuery();
  const { team } = useTeam();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createSubscription] = useCreateSubscriptionMutation({
    refetchQueries: [
      { query: GetCurrentUserDocument },
      { query: GetTeamDocument },
    ],
    awaitRefetchQueries: true,
  });

  const finishSuccess = useCallback(
    (planNickname?: string) => {
      if (planNickname) {
        // Reflect the new tier in the local auth store while the refetches are inflight.
        updateUser({ paidUser: planNickname });
        // `getTier` is imported so the resolver-side mapping logic stays consistent
        // with dashboard-ff's start-trial flow even though we only consume `paidUser`.
        void getTier(planNickname);
      }
      toast({
        message: `Your ${trialPeriodDays}-day free trial has started!`,
        type: "success",
      });
      onCompleted?.();
    },
    [updateUser, trialPeriodDays, onCompleted],
  );

  const threeDs = useThreeDsCompletion({
    onCompleted: finishSuccess,
    onTimeout: (message) => {
      setError(message);
      toast({ title: "Verification timed out", message, type: "error" });
    },
  });

  const submit = useCallback(
    async ({ country, zipCode }: SubmitArgs) => {
      if (!stripe || !stripeElements || !user) return;

      setLoading(true);
      setError(null);

      try {
        const cardElement = stripeElements.getElement(CardNumberElement);
        if (!cardElement) {
          throw new Error("Card details are incomplete.");
        }

        // Derive the US state from the ZIP code so Stripe (and our billing
        // service) can resolve the customer's tax-relevant address. Mirrors
        // dashboard-ff's free-trial flow.
        const state =
          country === "US" && zipCode ? getUSStateFromZipCode(zipCode) : null;

        const { token, error: tokenError } = await stripe.createToken(
          cardElement,
          {
            name: currentUserData?.user?.profile?.name || user.name || "",
            address_country: country,
            ...(zipCode ? { address_zip: zipCode } : {}),
            ...(state ? { address_state: state } : {}),
          },
        );

        if (tokenError || !token) {
          throw new Error(tokenError?.message || "Could not validate card");
        }

        const { card } = token;
        if (!card) {
          throw new Error("Could not validate card");
        }

        const cardInfo = {
          tokenId: token.id,
          brand: card.brand,
          exp_month: card.exp_month,
          exp_year: card.exp_year,
          last4: card.last4,
          id: card.id,
        };

        const teamSize = team?.teammates
          ? getTeamSize(team.teammates as unknown as Teammate[])
          : 0;

        const result = await createSubscription({
          variables: {
            plan: getPlanNickname(interval),
            seats: teamSize || 1,
            trialPeriodDays,
            cardInfo,
            ...(referral ? { referral } : {}),
            ...(paywall ? { paywall } : {}),
          },
        });

        const created = result.data?.createSubscription;
        if (!created) {
          throw new Error("Subscription could not be created.");
        }

        // 3DS branch: the card requires bank-side authentication before Stripe
        // attaches the subscription. Hand off to the 3DS hook; it will open the
        // redirect, poll for completion, and call `finishSuccess` when done.
        if (created.is3ds && created.redirectUrl) {
          threeDs.start(created.redirectUrl);
          return;
        }

        const subscription = created.subscription;
        if (!subscription) {
          throw new Error("Subscription could not be created.");
        }

        const newPlanNickname =
          subscription?.items?.data?.[0]?.price?.nickname ?? undefined;

        // Refresh Apollo cache for any field policies that depend on subscription status.
        await apollo.reFetchObservableQueries();

        finishSuccess(newPlanNickname);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        setError(message);
        toast({ title: "Could not start trial", message, type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [
      stripe,
      stripeElements,
      user,
      currentUserData?.user?.profile?.name,
      team?.teammates,
      interval,
      trialPeriodDays,
      referral,
      paywall,
      createSubscription,
      apollo,
      threeDs,
      finishSuccess,
    ],
  );

  return {
    submit,
    loading,
    error,
    pending3ds: threeDs.pending,
    retry3ds: threeDs.retry,
    cancelPending3ds: threeDs.cancel,
  };
}

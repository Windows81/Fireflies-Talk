import { Config } from "@/constants";
import { useBilling } from "@/features/billing";
import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { openURL } from "@/features/navigation";
import {
  TeamOnboardingSuggestionType,
  useGetTeamOnboardingSuggestion,
} from "@/features/onboarding";
import { EnumFreeTrial, useGetCurrentUserQuery } from "@/graphql";
import { parseTimestamp } from "@/utils/date";
import { formatDistanceToNow } from "date-fns";
import { create } from "zustand";
import { FREE_TRIAL_DAYS } from "./constants";

const PWL = "desktop-trial-banner";

interface TrialBannerDismissalState {
  isDismissed: boolean;
  dismiss: () => void;
}

const useTrialBannerDismissal = create<TrialBannerDismissalState>((set) => ({
  isDismissed: false,
  dismiss: () => set({ isDismissed: true }),
}));

export interface TrialOffer {
  message: string;
  ctaLabel: string;
  onPress: () => void;
  dismiss: () => void;
}

const getStartTrialUrl = (freeTrial: EnumFreeTrial) => {
  const path = freeTrial === EnumFreeTrial.Cc ? "/free-trial" : "/";
  return `${Config.DASHBOARD_URL}${path}?pwl=${PWL}`;
};

export const useTrialBanner = (): TrialOffer | null => {
  const { data } = useGetCurrentUserQuery();
  const { isFreeUser } = useBilling();
  const { teamOnboardingSuggestion } = useGetTeamOnboardingSuggestion();

  const isSkipTrialExperimentOn = useFeatureIsOn(
    FEATURE_FLAGS.SKIP_TRIAL_FROM_ONBOARDING_EXPERIMENT,
  );
  const { isDismissed, dismiss } = useTrialBannerDismissal();

  const user = data?.user;
  const stripeAccount = user?.teamStripeAccount?.[0];

  if (isDismissed || isSkipTrialExperimentOn) return null;

  const trialEndsAt = stripeAccount?.freeTrial
    ? parseTimestamp(stripeAccount.trialEndsAt)
    : null;
  if (trialEndsAt && trialEndsAt.getTime() > Date.now()) {
    return {
      message: `You have ${formatDistanceToNow(trialEndsAt)} left in your business plan free trial.`,
      ctaLabel: "Subscribe now",
      onPress: () => openURL(`${Config.DASHBOARD_URL}/upgrade?pwl=${PWL}`),
      dismiss,
    };
  }

  if (!user?.freeTrial) return null;

  const canActOnOffer =
    isFreeUser &&
    !!user.isAdmin &&
    teamOnboardingSuggestion?.suggestion !==
      TeamOnboardingSuggestionType.REQUEST_TEAMS;

  if (!canActOnOffer) return null;

  const startTrialUrl = getStartTrialUrl(user.freeTrial);
  return {
    message: `You are eligible for ${FREE_TRIAL_DAYS} days business plan free trial.`,
    ctaLabel: "Start free trial",
    onPress: () => openURL(startTrialUrl),
    dismiss,
  };
};

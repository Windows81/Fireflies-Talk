import {
  startUpgradeFlow,
  useBilling,
  usePaywallConfig,
} from "@/features/billing";
import { trackPaywallShown } from "@/features/paywall";
import { PaywallVisibility } from "@firefliesai/mobile-ff.graphql-client";
import { useEffect } from "react";

export interface AskFredPaywallSource {
  pwl: string;
  from: string;
}

export interface AskFredPaywallOffer {
  title: string;
  description: string;
  cta?: { label: string; onPress: () => void };
}

/**
 * Free users need a plan upgrade; paid users buy the AI credits add-on. Of the
 * latter, those who already had a subscription have run their credits out,
 * while the rest are meeting the add-on for the first time.
 */
const getCopy = ({
  isFreeUser,
  hasCreditsSubscription,
}: {
  isFreeUser: boolean;
  hasCreditsSubscription: boolean;
}) => {
  if (isFreeUser) {
    return {
      title: "Unlock AskFred",
      description: "Ask anything across your meetings",
      ctaLabel: "Upgrade",
    };
  }
  return {
    title: hasCreditsSubscription ? "AI Credits Exhausted" : "Unlock AskFred",
    description: "Subscribe to AI credits and start using",
    ctaLabel: "Subscribe",
  };
};

/**
 * Whether an AskFred pane is paywalled, and the copy to show if so. Returns
 * `null` while the user can chat.
 */
export const useAskFredPaywall = ({
  pwl,
  from,
  forceGated = false,
  enabled = true,
}: AskFredPaywallSource & {
  forceGated?: boolean;
  enabled?: boolean;
}): AskFredPaywallOffer | null => {
  const {
    isAllowedToUsePrompts,
    aiExtensionsSubscription,
    isFreeUser,
    hasLoaded,
  } = useBilling();
  const { visibility } = usePaywallConfig();

  const isGated = hasLoaded && (!isAllowedToUsePrompts || forceGated);

  useEffect(() => {
    if (!enabled || !isGated) return;
    trackPaywallShown({ paywall: "ask-fred", from });
  }, [enabled, isGated, from]);

  if (!isGated) return null;

  const { title, description, ctaLabel } = getCopy({
    isFreeUser,
    hasCreditsSubscription: !!aiExtensionsSubscription,
  });

  return {
    title,
    description,
    cta:
      visibility === PaywallVisibility.Show
        ? {
            label: ctaLabel,
            onPress: () => startUpgradeFlow({ pwl, forAskFred: !isFreeUser }),
          }
        : undefined,
  };
};

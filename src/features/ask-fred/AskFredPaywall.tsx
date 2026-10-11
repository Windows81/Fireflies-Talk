import { InAppPaywallModal } from "@/components/Paywall";
import { Text } from "@/components/Typography";
import { useBilling } from "@/features/billing";
import { trackPaywallShown } from "@/features/paywall";
import type { AiExtensionsSubscription } from "@/graphql";
import { createStyles } from "@/styles";
import { Tier } from "@firefliesai/payments-ff.utils";
import { format } from "date-fns";
import { type FC, useEffect } from "react";
import { View } from "react-native";
import { PaywallContent } from "src/components/Paywall/PaywallContent";
import { TIER_PRICE_MAP } from "src/constants/billing";
import SvgCounter from "./assets/Counter.svg";

function getTitleAndDescription({
  aiExtensionsSubscription,
  isFreeUser,
}: {
  aiExtensionsSubscription: AiExtensionsSubscription | null | undefined;
  isFreeUser: boolean;
}) {
  if (isFreeUser) {
    return {
      title: "Upgrade to Access AskFred",
      description:
        "Get instant answers to your questions, trends and campaign performances across different meetings.",
    };
  }

  return {
    title: aiExtensionsSubscription
      ? "To continue using AskFred, please upgrade your AI credits package"
      : "Try AskFred: ChatGPT for meetings.",
    description: aiExtensionsSubscription?.nextPaymentAt
      ? `Current package will auto-renew on\n${format(
          new Date(aiExtensionsSubscription.nextPaymentAt),
          "MMM d, yyyy",
        )}`
      : "Do more with your meetings using AskFred.",
  };
}

export const AskFredPaywall: FC<{
  from: string;
  close?: () => void;
}> = ({ from, close }) => {
  const { aiExtensionsSubscription, isFreeUser } = useBilling();

  useEffect(() => {
    trackPaywallShown({
      paywall: "ask-fred",
      from,
    });
  }, [from]);

  const { title, description } = getTitleAndDescription({
    aiExtensionsSubscription,
    isFreeUser,
  });

  return (
    <PaywallContent
      header={isFreeUser ? null : <AskFredPaywallHeader />}
      title={title}
      description={description}
      pwl="mobile_ask-fred"
      forAskFred
      minPrice={isFreeUser ? TIER_PRICE_MAP[Tier.PRO] : null}
      onUpgradePress={close}
    />
  );
};

export const AskFredPaywallModal: FC<{
  isOpen: boolean;
  close: () => void;
  from: string;
}> = ({ isOpen, close, from }) => {
  useEffect(() => {
    if (isOpen) {
      trackPaywallShown({
        paywall: "ask-fred",
        from,
      });
    }
  }, [from, isOpen]);

  const { aiExtensionsSubscription, isFreeUser } = useBilling();

  const { title, description } = getTitleAndDescription({
    aiExtensionsSubscription,
    isFreeUser,
  });

  return (
    <InAppPaywallModal
      header={isFreeUser ? null : <AskFredPaywallHeader />}
      isOpen={isOpen}
      title={title}
      description={description}
      pwl="mobile_ask-fred"
      forAskFred
      onClose={close}
      minTier={isFreeUser ? Tier.PRO : null}
      isPaidUser={!isFreeUser}
    />
  );
};

const AskFredPaywallHeader = () => {
  const {
    aiExtensionsSubscription,
    teamPromptsConsumed,
    monthlyAICreditsUsed,
    monthlyAICreditsLimit,
  } = useBilling();

  const creditsLeft = Math.max(0, monthlyAICreditsLimit - monthlyAICreditsUsed);

  return (
    <View style={styles.header}>
      <SvgCounter />
      {aiExtensionsSubscription && teamPromptsConsumed && (
        <Text variant="label1Regular" color="informationStaticYellowText">
          {creditsLeft} / {monthlyAICreditsLimit} AI Credits left
        </Text>
      )}
    </View>
  );
};

const styles = createStyles({
  header: {
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
});

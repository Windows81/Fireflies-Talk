import { useBilling } from "@/features/billing";
import type { FC } from "react";
import { ASSIST_MODES, type AssistMode } from "src/features/live/types";
import { DesktopPaywallCard } from "./DesktopPaywallCard";
import { LiveAssistFeaturePreview } from "./LiveAssistFeaturePreview";
import { LiveAssistPausedPreview } from "./LiveAssistPausedPreview";

/**
 * Both assist modes are gated on the same AI credits entitlement, so a variant
 * is picked by mode and by why the user is blocked: free users are sold a plan,
 * paid users out of credits are sold the credits add-on.
 */
const COPY = {
  [ASSIST_MODES.GENERAL]: {
    free: {
      title: "Get access to Live Assist",
      description:
        "To use Live Assist and enjoy other AI-powered features, please upgrade to a paid plan.",
    },
    outOfCredits: {
      title: "Get live suggestions with Live Assist",
      description:
        "To use Live Assist and enjoy other AI-powered features, please subscribe to AI credits.",
    },
  },
  [ASSIST_MODES.SALES]: {
    free: {
      title: "Close more deals with Sales Assist",
      description: "Upgrade to use Sales Assist and other premium features.",
    },
    outOfCredits: {
      title: "Sales Assist is paused",
      description: "Get AI credits to keep receiving live suggestions.",
    },
  },
} satisfies Record<
  AssistMode,
  Record<"free" | "outOfCredits", { title: string; description: string }>
>;

const PWL = {
  [ASSIST_MODES.GENERAL]: "desktop_live-assist",
  [ASSIST_MODES.SALES]: "desktop_sales-assist",
} satisfies Record<AssistMode, string>;

/**
 * Blocking paywall that replaces the live suggestions feed. Shows a preview of
 * the suggestions being sold above the pitch.
 */
export const LiveAssistPaywall: FC<{
  assistMode: AssistMode;
  compactMode?: boolean;
}> = ({ assistMode, compactMode }) => {
  const { isFreeUser } = useBilling();

  const variant = isFreeUser ? "free" : "outOfCredits";
  const { title, description } = COPY[assistMode][variant];

  // A paused Sales Assist feed is the one case where the user has already seen
  // real suggestions, so it previews one of those rather than a generic card.
  const showPausedPreview =
    assistMode === ASSIST_MODES.SALES && variant === "outOfCredits";

  return (
    <DesktopPaywallCard
      title={title}
      description={description}
      pwl={PWL[assistMode]}
      from={compactMode ? "live-screen-compact" : "live-screen-full"}
      icon={
        showPausedPreview ? (
          <LiveAssistPausedPreview />
        ) : (
          <LiveAssistFeaturePreview />
        )
      }
      showCreditsInfo
      ctaText={isFreeUser ? "Upgrade" : "Subscribe Now"}
    />
  );
};

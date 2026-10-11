import { useBilling } from "@/features/billing";
import { isDesktop } from "@/utils/device";
import { ASSIST_MODES, type AssistMode } from "src/features/live/types";

/**
 * Whether the live suggestions feed is replaced by its paywall.
 *
 * Shared because two callers need the same answer: the feed decides what to
 * render, and the compact window decides how tall to be. If they disagree the
 * window clips the paywall's CTA.
 */
export const useIsLiveAssistPaywalled = ({
  assistMode,
  isDemo,
  showSalesAssistPaywall,
}: {
  assistMode: AssistMode;
  isDemo?: boolean;
  /** Set when the server rejects a Sales Assist prompt for lack of credits. */
  showSalesAssistPaywall?: boolean;
}): boolean => {
  const { isAllowedToUsePrompts, loading } = useBilling();

  const isBlocked =
    !isAllowedToUsePrompts ||
    (assistMode === ASSIST_MODES.SALES && !!showSalesAssistPaywall);

  // Demo recordings are exempt so the onboarding walkthrough still plays.
  return isDesktop && isBlocked && !loading && !isDemo;
};

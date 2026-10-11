import { useBilling, usePaywallConfig } from "@/features/billing";
import { PaywallVisibility } from "@firefliesai/mobile-ff.graphql-client";
import type { TranscriptStatus } from "../../types";

/**
 * Whether the meeting is still waiting on a transcript that the spent quota
 * will never deliver. Failed and silent meetings keep their own explanation —
 * the quota is not what stopped them.
 */
export const isAwaitingTranscript = (status: TranscriptStatus) =>
  status === "not-transcribed" || status === "transcribing";

/**
 * Summaries and transcripts share one quota: the free-meetings counter. Once it
 * runs out the meeting is never transcribed, so neither pane has content to
 * wait for and both sell the upgrade instead.
 */
export const useFreeMeetingsPaywall = () => {
  const { reachedFreeMeetingsLimit } = useBilling();
  const { visibility } = usePaywallConfig();

  return {
    isOutOfFreeMeetings:
      reachedFreeMeetingsLimit && visibility !== PaywallVisibility.Hidden,
    /** False in builds where upgrading is not offered (app-store review, etc). */
    showUpgrade: visibility === PaywallVisibility.Show,
  };
};

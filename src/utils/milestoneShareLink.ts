import type { WordMilestone } from "@/hooks/dictationStats";

/**
 * The link the shared card's caption carries. The base comes in rather than
 * reading TALK_LANDING_URL here so the attribution params can be tested
 * without dragging the whole constants barrel along.
 */
export const milestoneShareUrl = (
  baseUrl: string,
  milestone: WordMilestone,
): string =>
  `${baseUrl}?${new URLSearchParams({
    utm_source: "talk",
    utm_medium: "milestone_share",
    utm_campaign: `milestone_${milestone.words}`,
  })}`;

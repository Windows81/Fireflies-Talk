import { Tier } from "@firefliesai/payments-ff.utils";

export const TIER_PRICE_MAP: Record<Tier, number> = {
  [Tier.FREE]: 0,
  [Tier.PRO]: 10,
  [Tier.BUSINESS]: 19,
  [Tier.ENTERPRISE]: 39,
};

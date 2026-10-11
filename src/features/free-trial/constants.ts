import { DESKTOP_THEME } from "@/styles/color";
import { formatUsd } from "@/utils/price";

/** Length of the free-trial period offered during onboarding. */
export const FREE_TRIAL_DAYS = 7;

/** Per-seat monthly price billed every month on the monthly plan. */
export const FREE_TRIAL_MONTHLY_PRICE_USD = 29;

/** Per-seat one-time price billed yearly on the annual plan. */
export const FREE_TRIAL_ANNUAL_TOTAL_USD = 228;

/** Effective per-month price when on the annual plan (e.g. "$19/mo billed annually"). */
export const FREE_TRIAL_ANNUAL_PER_MONTH_USD = FREE_TRIAL_ANNUAL_TOTAL_USD / 12;

/**
 * Discount the annual plan offers vs paying monthly for 12 months.
 * Rounded to a whole number for display in the UI (badges, copy).
 */
export const FREE_TRIAL_ANNUAL_DISCOUNT_PCT = "44";

export type FreeTrialInterval = "month" | "year";

export const freeTrialIntervalCopy = (interval: FreeTrialInterval): string =>
  interval === "year"
    ? `${formatUsd(FREE_TRIAL_ANNUAL_TOTAL_USD)}/seat/year`
    : `${formatUsd(FREE_TRIAL_MONTHLY_PRICE_USD)}/seat/month`;

/** Element styling rendered inside the Stripe iframes on the free-trial card form. */
export const FREE_TRIAL_CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#FFFFFF",
      fontSize: "14px",
      fontFamily: "Inter, system-ui, sans-serif",
      "::placeholder": { color: "rgba(255, 255, 255, 0.2)" },
    },
    invalid: { color: DESKTOP_THEME.red500 },
  },
};

import { Config } from "@/constants";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Lazily-resolved Stripe.js instance. Returns `null` if no publishable key
 * is configured (e.g. on mobile builds where the trial flow never renders).
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (stripePromise) return stripePromise;
  const key = Config.STRIPE_PUBLISHABLE_KEY || "";

  if (!key) {
    stripePromise = Promise.resolve(null);
    return stripePromise;
  }
  stripePromise = loadStripe(key);
  return stripePromise;
}

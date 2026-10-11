import { GrowthBook } from "@growthbook/growthbook-react";
import { useAuth } from "../auth/store";
import { storage } from "../storage";
import { FEATURE_FLAG_STORAGE_KEY } from "./featureFlags";

/**
 * Sync read of a GrowthBook flag for non-React call sites. Mirrors
 * FeatureFlagProvider's GrowthBook config — same persisted features payload
 * AND the same user attributes — so targeting and rollout rules evaluate
 * identically to useFeatureIsOn. Without the user, attribute-based rules fall
 * back to defaults.
 *
 * Imports the auth store directly (not the `../auth` barrel) and must only be
 * called at runtime, never during module evaluation: the auth store depends
 * on the persisted settings store, so a store-init call site would re-enter
 * the auth module graph while it is still initialising.
 */
export const readFeatureIsOn = (flag: string): boolean => {
  const features = JSON.parse(
    storage.getItem(FEATURE_FLAG_STORAGE_KEY) || "{}",
  );
  const { user } = useAuth.getState();

  return new GrowthBook({ user: { ...user }, features }).isOn(flag);
};

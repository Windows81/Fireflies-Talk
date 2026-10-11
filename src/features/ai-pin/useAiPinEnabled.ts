import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";
import { Platform } from "react-native";
import { isAiPinExperienceEnabled } from "./eligibility";

export function useAiPinEnabled() {
  const pilotEnabled = useFeatureValue(
    FEATURE_FLAGS.MOBILE_AI_PIN_PILOT,
    false,
  );
  // Development builds intentionally bypass GrowthBook. Production fails
  // closed unless the flag resolves to the boolean value true.
  return isAiPinExperienceEnabled(Platform.OS, pilotEnabled, __DEV__);
}

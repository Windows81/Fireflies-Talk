import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";

export const useIsAskFredOEnabled = (): boolean =>
  useFeatureIsOn(FEATURE_FLAGS.MOBILE_ASK_FRED_O);

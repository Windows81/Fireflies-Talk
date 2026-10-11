import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";

/** An admin turned screen context off for this user's team. */
export const useIsScreenContextDisabledByAdmin = (): boolean =>
  useFeatureValue(FEATURE_FLAGS.DESKTOP_DISABLE_SCREEN_CONTEXT, false);

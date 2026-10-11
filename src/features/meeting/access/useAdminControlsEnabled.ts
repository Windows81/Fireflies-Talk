import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";

export const useAdminControlsEnabled = (): boolean => {
  const flag = useFeatureIsOn(FEATURE_FLAGS.ADMIN_CONTROLS);
  return __DEV__ || flag;
};

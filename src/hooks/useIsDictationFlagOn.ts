import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";

/** Whether Fireflies Talk (dictation) is available to this user at all. */
export const useIsDictationFlagOn = (): boolean =>
  useFeatureIsOn(FEATURE_FLAGS.DICTATION_ENABLED);

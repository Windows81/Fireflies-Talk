import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";

/**
 * Manual notes are gated behind the `MOBILE_MANUAL_NOTES_ENABLED` GrowthBook
 * feature flag. Use this hook anywhere the feature surfaces (tabs, inline
 * sections, auto-upload) so the gate stays in one place — if rollout
 * criteria change we only need to update the flag's targeting rules.
 */
export const useIsManualNotesEnabled = (): boolean =>
  useFeatureIsOn(FEATURE_FLAGS.MOBILE_MANUAL_NOTES_ENABLED);

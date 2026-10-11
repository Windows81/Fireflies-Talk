import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { readFeatureIsOn } from "@/features/feature-flags/readFeatureIsOn";

/**
 * Sync read of the DESKTOP_NOTEPAD flag for non-React call sites
 * (e.g. openLiveDestination). Without the user attributes the rollout rules
 * could route eligible users to the legacy live window.
 */
export const isDesktopNotepadEnabled = (): boolean =>
  readFeatureIsOn(FEATURE_FLAGS.DESKTOP_NOTEPAD);

export const useIsDesktopNotepadEnabled = (): boolean =>
  useFeatureIsOn(FEATURE_FLAGS.DESKTOP_NOTEPAD);

import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { useEffect } from "react";

/** Whether the on-demand Polish action (Fn + 1) is available to this user. */
export const useIsTalkPolishActionFlagOn = (): boolean =>
  useFeatureIsOn(FEATURE_FLAGS.DESKTOP_DICTATION_POLISH_ACTION);

/**
 * Keeps Electron's polish gate in step with the flag. Runs in the main window
 * (alongside useDictation) so a flag change picked up by polling takes effect
 * without opening Settings.
 */
export function useSyncTalkPolishAction(): void {
  const flagOn = useIsTalkPolishActionFlagOn();

  useEffect(() => {
    window.electron?.dictation?.setPolishActionEnabled?.(flagOn);
  }, [flagOn]);
}

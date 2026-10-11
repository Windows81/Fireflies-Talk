import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { useEffect } from "react";
import { useLocalSettings } from "./useLocalSettings";

/** Whether Action mode is available to this user at all. */
export const useIsTalkActionModeFlagOn = (): boolean =>
  useFeatureIsOn(FEATURE_FLAGS.MOBILE_TALK_ACTION_MODE);

/**
 * Sole owner of Electron's action-mode master switch: keeps it in step with
 * the flag and the user's preference. Runs in the main window (alongside
 * useDictation) so a flag change picked up by polling takes effect without
 * opening Settings. The persisted settings store deliberately does not push
 * this on rehydrate — reading the flag there needs the auth store, which
 * itself depends on the settings store.
 */
export function useSyncTalkActionMode(): void {
  const flagOn = useIsTalkActionModeFlagOn();
  const { dictationActionModeEnabled } = useLocalSettings();

  useEffect(() => {
    window.electron?.dictation?.setActionModeEnabled?.(
      flagOn && dictationActionModeEnabled,
    );
  }, [flagOn, dictationActionModeEnabled]);
}

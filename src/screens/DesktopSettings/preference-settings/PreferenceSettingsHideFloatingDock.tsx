import { Switch } from "@/components/Switch";
import { type FC, useEffect } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";

export const PreferenceSettingsHideFloatingDock: FC = () => {
  const {
    hideFloatingDockWhenScreenSharing,
    setHideFloatingDockWhenScreenSharing,
  } = useLocalSettings();

  // Apply content protection setting to electron windows on mount and when setting changes
  // This ensures the setting is applied even if this component loads after store rehydration
  useEffect(() => {
    if (window.electron?.window?.setContentProtection) {
      window.electron.window
        .setContentProtection(hideFloatingDockWhenScreenSharing)
        .catch((error) => {
          console.error(
            "[PREFERENCE_SETTINGS] Failed to set content protection:",
            error,
          );
        });
    }
  }, [hideFloatingDockWhenScreenSharing]);

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Hide floating dock when screen sharing"
            description="Fireflies dock and app UI will not be visible when screen sharing during a live meeting."
            id="setting-label-hide-floating-dock"
          />
          <Switch
            value={hideFloatingDockWhenScreenSharing}
            onValueChange={setHideFloatingDockWhenScreenSharing}
            aria-labelledby="setting-label-hide-floating-dock"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

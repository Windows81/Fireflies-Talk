import { Switch } from "@/components/Switch";
import { type FC, useCallback, useEffect } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import {
  setLaunchAtStartupSilently,
  syncLaunchAtStartup,
  useLocalSettings,
} from "@/features/settings";

export const PreferenceSettingsLaunchAtStartup: FC = () => {
  const { launchAtStartup, setLaunchAtStartup } = useLocalSettings();

  // Reconcile the stored preference with the OS login item when opening settings
  useEffect(() => {
    syncLaunchAtStartup({
      launchAtStartup,
      syncPreference: setLaunchAtStartupSilently,
    }).catch((error) => {
      console.error(
        "[PREFERENCE_SETTINGS] Failed to sync login item settings:",
        error,
      );
    });
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only write to the OS when the user explicitly toggles the switch
  const handleToggle = useCallback(
    (value: boolean) => {
      setLaunchAtStartup(value);
      window.electron?.app?.setLoginItemSettings(value).catch((error) => {
        console.error(
          "[PREFERENCE_SETTINGS] Failed to set login item settings:",
          error,
        );
      });
    },
    [setLaunchAtStartup],
  );

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Launch at start up"
            description="Auto-open Fireflies when you start or login into your device."
            id="setting-label-launch-at-startup"
          />
          <Switch
            value={launchAtStartup}
            onValueChange={handleToggle}
            aria-labelledby="setting-label-launch-at-startup"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

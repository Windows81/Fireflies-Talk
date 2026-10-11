import { Switch } from "@/components/Switch";
import { useLocalSettings } from "@/features/settings";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useCallback, type FC } from "react";
import { AppExclusionPicker } from "../notification-settings/AppExclusionPicker";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const PreferenceSettingsAutoStartNotes: FC = () => {
  const {
    autoStartNotes,
    setAutoStartNotes,
    excludedAppsForAutoStart,
    setExcludedAppsForAutoStart,
  } = useLocalSettings();

  const handleToggle = useCallback(
    (enabled: boolean) => {
      tracker.track(TRACKING_EVENTS.DESKTOP_AUTO_START_NOTES_TOGGLED, {
        enabled,
        source: "settings",
      });
      setAutoStartNotes(enabled);
    },
    [setAutoStartNotes],
  );

  const handleExcludedAppsChange = useCallback(
    (apps: string[]) => {
      const added = apps.find((a) => !excludedAppsForAutoStart.includes(a));
      const removed = excludedAppsForAutoStart.find((a) => !apps.includes(a));
      if (added) {
        tracker.track(TRACKING_EVENTS.DESKTOP_AUTO_START_NOTES_APP_EXCLUDED, {
          app: added,
          action: "added",
        });
      } else if (removed) {
        tracker.track(TRACKING_EVENTS.DESKTOP_AUTO_START_NOTES_APP_EXCLUDED, {
          app: removed,
          action: "removed",
        });
      }
      setExcludedAppsForAutoStart(apps);
    },
    [excludedAppsForAutoStart, setExcludedAppsForAutoStart],
  );

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Automatically take notes"
            description="Start taking notes automatically when a meeting is detected."
            id="setting-label-auto-start-notes"
          />
          <Switch
            value={autoStartNotes}
            onValueChange={handleToggle}
            aria-labelledby="setting-label-auto-start-notes"
          />
        </SettingRow>
        {autoStartNotes && (
          <AppExclusionPicker
            label="Don't automatically take notes when a call is detected in these apps:"
            excludedApps={excludedAppsForAutoStart}
            onChangeExcludedApps={handleExcludedAppsChange}
          />
        )}
      </SettingField>
    </SettingsGroup>
  );
};

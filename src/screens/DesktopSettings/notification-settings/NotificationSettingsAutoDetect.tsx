import { Switch } from "@/components/Switch";
import { useLocalSettings } from "@/features/settings";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useCallback, type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { AppExclusionPicker } from "./AppExclusionPicker";

export const NotificationSettingsAutoDetect: FC = () => {
  const {
    autoDetectMeetings,
    setAutoDetectMeetings,
    excludedAppsForNotification,
    setExcludedAppsForNotification,
  } = useLocalSettings();

  const handleExcludedAppsChange = useCallback(
    (apps: string[]) => {
      const added = apps.find((a) => !excludedAppsForNotification.includes(a));
      const removed = excludedAppsForNotification.find(
        (a) => !apps.includes(a),
      );
      if (added) {
        tracker.track(
          TRACKING_EVENTS.DESKTOP_MEETING_NOTIFICATION_APP_EXCLUDED,
          { app: added, action: "added" },
        );
      } else if (removed) {
        tracker.track(
          TRACKING_EVENTS.DESKTOP_MEETING_NOTIFICATION_APP_EXCLUDED,
          { app: removed, action: "removed" },
        );
      }
      setExcludedAppsForNotification(apps);
    },
    [excludedAppsForNotification, setExcludedAppsForNotification],
  );

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Notify when a meeting is detected"
            description="Get a notification to capture a live meeting."
            id="setting-label-auto-detect"
          />
          <Switch
            value={autoDetectMeetings}
            onValueChange={setAutoDetectMeetings}
            aria-labelledby="setting-label-auto-detect"
          />
        </SettingRow>
        {autoDetectMeetings && (
          <AppExclusionPicker
            label="Don't notify me when a call is detected in these apps:"
            excludedApps={excludedAppsForNotification}
            onChangeExcludedApps={handleExcludedAppsChange}
          />
        )}
      </SettingField>
    </SettingsGroup>
  );
};

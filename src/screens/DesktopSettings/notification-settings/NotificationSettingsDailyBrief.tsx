import { Switch } from "@/components/Switch";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";

export const NotificationSettingsDailyBrief: FC = () => {
  const { dailyBriefNotification, setDailyBriefNotification } =
    useLocalSettings();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Daily brief notification"
            description="Show a desktop notification when your daily meeting brief is ready, between 8 AM and 1 PM."
            id="setting-label-daily-brief"
          />
          <Switch
            value={dailyBriefNotification}
            onValueChange={setDailyBriefNotification}
            aria-labelledby="setting-label-daily-brief"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

import { Switch } from "@/components/Switch";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";

export const NotificationSettingsMeetingPrep: FC = () => {
  const { meetingPrepNotification, setMeetingPrepNotification } =
    useLocalSettings();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Meeting prep notification"
            description="Notify me 15 minutes before an upcoming calendar meeting starts, along with the meeting prep. (shown only if available)"
            id="setting-label-meeting-prep"
          />
          <Switch
            value={meetingPrepNotification}
            onValueChange={setMeetingPrepNotification}
            aria-labelledby="setting-label-meeting-prep"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

import { Switch } from "@/components/Switch";
import { useLocalSettings } from "@/features/settings";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const NotificationSettingsNotetakerJoined: FC = () => {
  const { notetakerJoinedNotification, setNotetakerJoinedNotification } =
    useLocalSettings();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Notify when notetaker joins call"
            description="Notify me when the notetaker has joined a call and started taking notes."
            id="setting-label-notetaker-joined"
          />
          <Switch
            value={notetakerJoinedNotification}
            onValueChange={setNotetakerJoinedNotification}
            aria-labelledby="setting-label-notetaker-joined"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

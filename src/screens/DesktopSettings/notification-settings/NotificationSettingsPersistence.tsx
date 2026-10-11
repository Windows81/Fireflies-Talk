import { Select, type SelectOption } from "@/components/Input";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";
import {
  useLocalSettings,
  type NotificationPersistence,
} from "@/features/settings";

const PERSISTENCE_OPTIONS: SelectOption<NotificationPersistence>[] = [
  {
    label: "Timed (auto-dismiss)",
    value: "timed",
  },
  {
    label: "Persistent (stay until dismissed)",
    value: "persistent",
  },
];

export const NotificationSettingsPersistence: FC = () => {
  const { notificationPersistence, setNotificationPersistence } =
    useLocalSettings();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingLabel
          title="Notification style"
          description="Choose whether meeting and calendar notifications dismiss automatically or stay until you close them."
          id="setting-label-notification-persistence"
        />
        <Select
          value={notificationPersistence}
          onValueChange={setNotificationPersistence}
          options={PERSISTENCE_OPTIONS}
          aria-labelledby="setting-label-notification-persistence"
        />
      </SettingField>
    </SettingsGroup>
  );
};

import { Select, type SelectOption } from "@/components/Input";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";
import {
  useLocalSettings,
  type UpcomingMeetingNotification,
} from "@/features/settings";

const UPCOMING_MEETING_NOTIFICATION_OPTIONS: SelectOption<UpcomingMeetingNotification>[] =
  [
    {
      label: "10 minutes before",
      value: "10_minutes",
    },
    {
      label: "5 minutes before",
      value: "5_minutes",
    },
    {
      label: "2 minutes before",
      value: "2_minutes",
    },
    {
      label: "On event time",
      value: "on_event_time",
    },
    {
      label: "Never",
      value: "never",
    },
  ];

export const NotificationSettingsUpcomingMeeting: FC = () => {
  const { upcomingMeetingNotification, setUpcomingMeetingNotification } =
    useLocalSettings();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingLabel
          title="Upcoming meeting notification"
          description="Choose when to show a reminder before each calendar meeting."
          id="setting-label-upcoming-meeting"
        />
        <Select
          value={upcomingMeetingNotification}
          onValueChange={setUpcomingMeetingNotification}
          options={UPCOMING_MEETING_NOTIFICATION_OPTIONS}
          aria-labelledby="setting-label-upcoming-meeting"
        />
      </SettingField>
    </SettingsGroup>
  );
};

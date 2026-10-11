import { Switch } from "@/components/Switch";
import { useSaveOptions } from "@/features/settings";
import { type User } from "@/graphql";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useTeam } from "@/features/team";
import { Text } from "@/components/Typography";

export const MeetingSettingsRecordVideo: FC<{
  user: User;
}> = ({ user }) => {
  const { team, isAdmin, loading } = useTeam();

  const { meetingVideoRecording: adminVideoRecordSetting } =
    team?.settings || {};

  const settingLocked =
    !loading && !isAdmin && !!team?.settings?.meetingVideoRecording;

  const shouldVideoRecord = settingLocked
    ? adminVideoRecordSetting === "enabled"
    : (user.shouldVideoRecordMeeting ?? false);

  const { updateOptions, loadingUpdateOptions } = useSaveOptions({
    errorMessage: "Could not save the setting",
    successMessage: "Setting saved successfully",
    user,
  });

  const updateShouldVideoRecord = (shouldVideoRecordMeeting: boolean) => {
    updateOptions({
      variables: {
        shouldVideoRecordMeeting,
      },
    });
  };

  return (
    <SettingsGroup title="Meeting Recordings">
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Record meeting video"
            description="Capture the video for your meetings"
            id="setting-label-record-meeting-video"
          />
          <Switch
            value={shouldVideoRecord}
            onValueChange={updateShouldVideoRecord}
            loading={loadingUpdateOptions}
            disabled={settingLocked}
            aria-labelledby="setting-label-record-meeting-video"
          />
        </SettingRow>
        {settingLocked && (
          <Text variant="label3Regular" color="informationStaticRedText">
            Your team admin has made these settings as default. Only they can
            change them.
          </Text>
        )}
      </SettingField>
    </SettingsGroup>
  );
};

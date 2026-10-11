import { Button } from "@/components/Button";
import { TextInput } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { useSaveOptions } from "@/features/settings";
import { useTeam } from "@/features/team";
import type { User } from "@/graphql";
import { isPaidUser } from "@firefliesai/payments-ff.utils";
import { useEffect, useState, type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

enum NOTIFICATION_PRIVACY {
  TEAMMATES = "teammates",
  ADMIN = "admin",
}

enum DISPATCH {
  ON = "on",
  BYPASS = "bypass",
}

export const MeetingComplianceParticipantNotification: FC<{
  user: User;
}> = ({ user }) => {
  const { team, isAdmin } = useTeam();

  // the user can toggle the notification setting if settings is not locked or user is admin
  const isNotificationSettingLocked =
    !isAdmin && team?.notificationSetting === NOTIFICATION_PRIVACY.ADMIN;
  const dispatch = (
    isNotificationSettingLocked ? team?.teamDispatch : user.dispatch
  ) as DISPATCH | undefined;

  // whether team allow teammates to update the notification message
  const recordingNotiLocked = !!team?.settings?.recordingNotiLocked && !isAdmin;
  const currentNotificationMessage =
    (recordingNotiLocked
      ? team?.settings?.recordingNoti
      : user.recordingNoti) || "";

  const { loadingUpdateOptions, updateOptions } = useSaveOptions({
    errorMessage: "Could not save participant notification option",
    successMessage: "Participant notification settings saved successfully",
    user,
  });

  const [notificationMessage, setNotificationMessage] = useState<string>(
    currentNotificationMessage,
  );

  useEffect(() => {
    setNotificationMessage(currentNotificationMessage);
  }, [currentNotificationMessage]);

  const onToggle = (value: boolean) => {
    updateOptions({
      variables: {
        dispatch: value ? DISPATCH.ON : DISPATCH.BYPASS,
      },
    });
  };

  const hasChanged = notificationMessage !== currentNotificationMessage;

  const onSave = () => {
    updateOptions({
      variables: {
        recordingNoti: notificationMessage,
      },
    });
  };

  const onCancel = () => {
    setNotificationMessage(currentNotificationMessage);
  };

  return (
    <SettingsGroup title="Notification Settings">
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Send participant notification"
            description="Inform all participants 1 hour prior to a meeting that Fireflies will be present to record it"
            id="setting-label-send-participant-notification"
          />
          <Switch
            value={dispatch === DISPATCH.ON}
            onValueChange={onToggle}
            loading={loadingUpdateOptions}
            disabled={isNotificationSettingLocked}
            aria-labelledby="setting-label-send-participant-notification"
          />
        </SettingRow>
        <TextInput
          placeholder="Enter a message to be sent to participants 1 hour before the meeting starts"
          aria-label="Participant notification message"
          disabled={
            dispatch !== DISPATCH.ON ||
            recordingNotiLocked ||
            loadingUpdateOptions ||
            // settings is only for pro user
            !isPaidUser(user.paidUser || "")
          }
          value={notificationMessage}
          onValueChange={setNotificationMessage}
          numberOfLines={6}
        />
        {hasChanged && (
          <SettingRow>
            <Button
              variant="transparentPrimary"
              size="xs"
              onPress={onSave}
              disabled={loadingUpdateOptions}
            >
              Save
            </Button>
            <Button
              variant="transparentNeutral"
              size="xs"
              onPress={onCancel}
              disabled={loadingUpdateOptions}
            >
              Cancel
            </Button>
          </SettingRow>
        )}
      </SettingField>
    </SettingsGroup>
  );
};

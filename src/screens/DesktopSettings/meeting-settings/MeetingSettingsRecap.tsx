import { Select } from "@/components/Input";
import { SEND_NOTES_TO_OPTIONS } from "@/constants";
import { useUpdateOptionsSendNotesTo } from "@/features/settings";
import { type User } from "@/graphql";
import type { FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";
import { IconMail } from "@/assets/svg";

export const MeetingSettingsRecap: FC<{
  user: User;
}> = ({ user }) => {
  const {
    sendNotesTo,
    updateSendNotesTo,
    loadingUpdateOptions,
    sendNotesToSettingsLocked,
  } = useUpdateOptionsSendNotesTo({ user });

  return (
    <SettingsGroup Icon={IconMail}>
      <SettingField>
        <SettingLabel
          id="send-notes-to-setting-section-label"
          title="Send email recap to"
          description="Share meeting recap as email with selected people."
        />
        <Select
          value={sendNotesTo}
          onValueChange={updateSendNotesTo}
          options={SEND_NOTES_TO_OPTIONS(user)}
          disabled={loadingUpdateOptions || sendNotesToSettingsLocked}
          aria-labelledby="send-notes-to-setting-section-label"
        />
      </SettingField>
    </SettingsGroup>
  );
};

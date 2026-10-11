import { Select } from "@/components/Input";
import { authApi } from "@/features/auth";
import { useMeetingPrivacyOptions } from "@/features/meeting";
import { useSaveOptions } from "@/features/settings";
import { useTeam } from "@/features/team";
import type { User } from "@/graphql";
import { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";
import { IconLock } from "@/assets/svg";

export const MeetingSettingsPrivacy: FC<{
  user: User;
}> = ({ user }) => {
  const privacy = (user.privacy ||
    MeetingNotesPrivacy.Owner) as MeetingNotesPrivacy;
  const privacyOptions = useMeetingPrivacyOptions();

  const { updateOptions, loadingUpdateOptions } = useSaveOptions({
    errorMessage: "Could not save meeting privacy option",
    successMessage: "Meeting privacy settings saved successfully",
    user,
    onComplete(data) {
      if (!data.saveOptions?.privacy) return;
      authApi.updateUser({
        privacy: data.saveOptions.privacy,
      });
    },
  });

  const updatePrivacy = (newPrivacy: MeetingNotesPrivacy) => {
    updateOptions({
      variables: {
        privacy: newPrivacy,
      },
    });
  };

  const { privacySettingsLocked } = useTeam();

  // TODO: add tooltip explaining privacySettingsLocked

  return (
    <SettingsGroup Icon={IconLock}>
      <SettingField>
        <SettingLabel
          id="privacy-setting-section-label"
          title="Meeting Privacy"
          description="Who can view meeting recaps by default"
        />
        <Select
          value={privacy}
          onValueChange={updatePrivacy}
          options={privacyOptions}
          disabled={loadingUpdateOptions || privacySettingsLocked}
          aria-labelledby="privacy-setting-section-label"
        />
      </SettingField>
    </SettingsGroup>
  );
};

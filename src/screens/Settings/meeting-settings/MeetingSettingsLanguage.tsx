import { Select } from "@/components/Input";
import { useUpdateOptionsLanguage } from "@/features/settings";
import type { User } from "@/graphql";
import type { FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLanguageOptions } from "@/features/language";

export const MeetingSettingsLanguage: FC<{
  user: User;
}> = ({ user }) => {
  const { language, updateLanguage, loadingUpdateOptions } =
    useUpdateOptionsLanguage({ user });
  const languageOptions = useLanguageOptions();

  return (
    <SettingsGroup title="Meeting Language">
      <SettingField>
        <SettingLabel
          id="language-setting-section-label"
          title="Language used to transcribe meetings"
          description="Select the language spoken during your meetings to get transcripts and summaries in that language"
        />
        <Select
          value={language}
          onValueChange={updateLanguage}
          options={languageOptions}
          disabled={loadingUpdateOptions}
          aria-labelledby="language-setting-section-label"
          showSearch
        />
      </SettingField>
    </SettingsGroup>
  );
};

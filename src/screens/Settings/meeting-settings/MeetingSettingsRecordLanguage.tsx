import { Select } from "@/components/Input";
import { useRecordPreferencesStore } from "@/features/live-record";
import { useUpdateOptionsLanguage } from "@/features/settings";
import type { User } from "@/graphql";
import type { FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLanguageOptions } from "@/features/language";

export const MeetingSettingsRecordLanguage: FC<{
  user: User;
}> = ({ user }) => {
  const { language: recordLanguage, setLanguage: setRecordLanguage } =
    useRecordPreferencesStore();
  const { language: optionsLanguage } = useUpdateOptionsLanguage({ user });
  const languageOptions = useLanguageOptions();

  if (recordLanguage === optionsLanguage) {
    return null;
  }

  return (
    <SettingsGroup title="Mobile Recording Language">
      <SettingField>
        <SettingLabel
          id="record-language-setting-section-label"
          title="Language used to transcribe mobile recordings"
          description="Select the language spoken during your mobile recordings to get transcripts and summaries in that language"
        />
        <Select
          value={recordLanguage}
          onValueChange={setRecordLanguage}
          options={languageOptions}
          aria-labelledby="record-language-setting-section-label"
          showSearch
        />
      </SettingField>
    </SettingsGroup>
  );
};

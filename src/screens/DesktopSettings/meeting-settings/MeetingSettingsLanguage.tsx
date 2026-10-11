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
import { IconGlobe } from "@/assets/svg";

export const MeetingSettingsLanguage: FC<{
  user: User;
}> = ({ user }) => {
  const { language, updateLanguage, loadingUpdateOptions } =
    useUpdateOptionsLanguage({ user });
  const languageOptions = useLanguageOptions();

  return (
    <SettingsGroup Icon={IconGlobe}>
      <SettingField>
        <SettingLabel
          id="language-setting-section-label"
          title="Language"
          description="Which language is spoken in your meetings."
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

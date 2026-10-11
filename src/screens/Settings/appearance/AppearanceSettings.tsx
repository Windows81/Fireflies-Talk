import { Select, type SelectOption } from "@/components/Input";
import {
  type AppearancePreference,
  useAppearanceStore,
} from "@/features/appearance";
import type { FC } from "react";
import { SettingField, SettingLabel } from "../components/SettingsForm";

const APPEARANCE_OPTIONS: SelectOption<AppearancePreference>[] = [
  { label: "Use system setting", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export const AppearanceSettings: FC = () => {
  const preference = useAppearanceStore((s) => s.preference);
  const setPreference = useAppearanceStore((s) => s.setPreference);

  return (
    <SettingField>
      <SettingLabel
        id="appearance-setting-label"
        title="Theme"
        description="Choose light or dark, or match your device"
      />
      <Select
        value={preference}
        onValueChange={setPreference}
        options={APPEARANCE_OPTIONS}
        aria-labelledby="appearance-setting-label"
      />
    </SettingField>
  );
};

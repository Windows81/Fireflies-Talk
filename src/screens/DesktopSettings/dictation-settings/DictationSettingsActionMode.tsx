import { Switch } from "@/components/Switch";
import { useLocalSettings } from "@/features/settings";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const DictationSettingsActionMode: FC = () => {
  const { dictationActionModeEnabled, setDictationActionModeEnabled } =
    useLocalSettings();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Action mode"
            description="Send what you say to Fred as a command instead of typing it out."
            id="setting-label-action-mode"
          />
          <Switch
            value={dictationActionModeEnabled}
            onValueChange={setDictationActionModeEnabled}
            aria-labelledby="setting-label-action-mode"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

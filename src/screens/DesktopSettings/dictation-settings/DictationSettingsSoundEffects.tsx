import { Switch } from "@/components/Switch";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";

export const DictationSettingsSoundEffects: FC = () => {
  const { dictationSoundEffects, setDictationSoundEffects } =
    useLocalSettings();

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Sound effects"
            description="Play a short sound when dictation starts, stops, is cancelled, or goes hands-free."
            id="setting-label-dictation-sound-effects"
          />
          <Switch
            value={dictationSoundEffects}
            onValueChange={setDictationSoundEffects}
            aria-labelledby="setting-label-dictation-sound-effects"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

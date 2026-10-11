import { Switch } from "@/components/Switch";
import { type FC, useEffect } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";

export const DictationSettingsPauseMedia: FC = () => {
  const { dictationPauseMediaEnabled, setDictationPauseMediaEnabled } =
    useLocalSettings();

  useEffect(() => {
    window.electron?.dictation?.setPauseMediaEnabled?.(
      dictationPauseMediaEnabled,
    );
  }, [dictationPauseMediaEnabled]);

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Pause media"
            description="Pause music and videos while you dictate, then resume when you stop."
            id="setting-label-dictation-pause-media"
          />
          <Switch
            value={dictationPauseMediaEnabled}
            onValueChange={setDictationPauseMediaEnabled}
            aria-labelledby="setting-label-dictation-pause-media"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

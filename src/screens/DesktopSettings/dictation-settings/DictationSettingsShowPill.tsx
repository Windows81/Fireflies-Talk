import { Switch } from "@/components/Switch";
import { type FC, useEffect } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";
import { DictationSettingsMinimizePill } from "./DictationSettingsMinimizePill";

export const DictationSettingsShowPill: FC = () => {
  const { showDictationPill, setShowDictationPill } = useLocalSettings();

  useEffect(() => {
    window.electron?.dictation?.setPillVisible?.(showDictationPill);
  }, [showDictationPill]);

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Floating pill"
            description="Show a small dictation control on your screen. The shortcut still works if this is off."
            id="setting-label-dictation-show-pill"
          />
          <Switch
            value={showDictationPill}
            onValueChange={setShowDictationPill}
            aria-labelledby="setting-label-dictation-show-pill"
          />
        </SettingRow>
        {showDictationPill && <DictationSettingsMinimizePill />}
      </SettingField>
    </SettingsGroup>
  );
};

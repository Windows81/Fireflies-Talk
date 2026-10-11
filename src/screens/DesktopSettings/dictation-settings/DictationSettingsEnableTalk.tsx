import { Button } from "@/components/Button";
import { getTalkDisabledCopy } from "@/hooks/dictationDisabledCopy";
import { useDictationTalkPolicy } from "@/hooks/useDictationTalkPolicy";
import { useTurnOnFirefliesTalk } from "@/hooks/useTurnOnFirefliesTalk";
import { type FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const DictationSettingsEnableTalk: FC = () => {
  const { disabledByUser, disabledByTeam, isTeamAdmin } =
    useDictationTalkPolicy();
  const { turnOn, loading } = useTurnOnFirefliesTalk();
  const copy = getTalkDisabledCopy({
    disabledByUser,
    disabledByTeam,
    isTeamAdmin,
  });

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title={copy.title}
            description={copy.description}
            id="setting-label-dictation-enable-talk"
          />
          {copy.canTurnOn && (
            <Button
              variant="outlined"
              size="sm"
              disabled={loading}
              onPress={turnOn}
              accessibilityLabel="Turn Fireflies Talk back on"
            >
              {copy.turnOnLabel}
            </Button>
          )}
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

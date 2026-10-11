import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import {
  REQUIRED_BY_ADMIN_MESSAGE,
  useDesktopConsentPolicy,
} from "@/features/consent-policy";
import {
  trackConsentUpdated,
  useConsentSnapshot,
} from "@/features/recording-consent";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "@/screens/DesktopSettings/components/SettingsForm";
import { useLocalSettings } from "@/features/settings/useLocalSettings";
import type { FC } from "react";

const DESCRIPTION =
  "Plays an audio message through your speakers when a recording starts, " +
  "so meeting participants can hear it via your microphone.";

export const AudioConsentSettings: FC = () => {
  const { audioConsentEnabled, setAudioConsentEnabled } = useLocalSettings();
  const snapshot = useConsentSnapshot();
  const required = useDesktopConsentPolicy().audio;

  const handleToggle = (value: boolean) => {
    setAudioConsentEnabled(value);
    trackConsentUpdated({
      channel: "audio",
      enabled: value,
      snapshot,
      source: "settings",
    });
  };

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Play audio consent message"
            description={DESCRIPTION}
            id="setting-label-audio-consent"
          />
          <Switch
            value={required || audioConsentEnabled}
            onValueChange={handleToggle}
            disabled={required}
            aria-labelledby="setting-label-audio-consent"
          />
        </SettingRow>
        {required && (
          <Text variant="body2Regular" color="textHint">
            {REQUIRED_BY_ADMIN_MESSAGE}
          </Text>
        )}
      </SettingField>
    </SettingsGroup>
  );
};

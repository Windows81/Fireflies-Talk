import { Switch } from "@/components/Switch";
import { useLocalSettings } from "@/features/settings";
import { getActualPlatform } from "@/utils/device";
import type { FC } from "react";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";

export const PreferenceSettingsMeetSpeakerNames: FC = () => {
  const { meetSpeakerNamesBeta, setMeetSpeakerNamesBeta } = useLocalSettings();

  const handleChange = (enabled: boolean) => {
    // Reading the meeting window needs the Accessibility permission, so
    // trigger the system prompt now instead of failing silently later.
    if (enabled) {
      window.electron?.browserMeetings?.requestAccessibilityPermission();
    }
    setMeetSpeakerNamesBeta(enabled);
  };

  // Only Google Meet in Chrome on macOS is supported in this release.
  if (getActualPlatform() !== "darwin") return null;

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Name speakers in your transcript (BETA)"
            description="Uses the names shown in your meeting app to label who is talking instead of Speaker 1, Speaker 2. Available on Mac for Google Meet in Chrome, with more meeting apps and Windows coming over time. Needs the Accessibility permission. Early version, it may miss speakers while you are presenting."
            id="setting-label-meet-speaker-names"
          />
          <Switch
            value={meetSpeakerNamesBeta}
            onValueChange={handleChange}
            aria-labelledby="setting-label-meet-speaker-names"
          />
        </SettingRow>
      </SettingField>
    </SettingsGroup>
  );
};

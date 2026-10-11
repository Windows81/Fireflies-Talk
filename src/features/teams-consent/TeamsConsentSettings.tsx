import { Button } from "@/components/Button";
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
import { useRecordingPreferencesQuery } from "@/graphql";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "@/screens/DesktopSettings/components/SettingsForm";
import { type FC, useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSetTeamsConsent } from "./useSetTeamsConsent";

// This settings section is only ever rendered on macOS (see
// DesktopSettingsScreen), since Meet/Zoom/Teams auto-send all require the
// Mac-only accessibility-gated keyboard module.
const DESCRIPTION =
  "Uses Accessibility permission to post a consent message to the meeting chat for you when a system audio recording starts. Supports Microsoft Teams (Business accounts), Google Meet, and Zoom.";

function useAccessibilityPermission() {
  const [granted, setGranted] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    const result =
      await window.electron?.browserMeetings?.checkAccessibilityPermission();
    setGranted(result ?? null);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  // Re-check when the window regains focus (user may have toggled in System Settings)
  useWindowFocus(check);

  const openSettings = useCallback(() => {
    window.electron?.browserMeetings?.openAccessibilitySettings();
  }, []);

  return { granted, openSettings };
}

export const TeamsConsentSettings: FC = () => {
  const { data, loading } = useRecordingPreferencesQuery({
    fetchPolicy: "cache-and-network",
  });
  const { setTeamsConsent, saving } = useSetTeamsConsent();
  const snapshot = useConsentSnapshot();
  const required = useDesktopConsentPolicy().chat;

  const preferences = data?.recordingPreferences;
  const enabled = preferences?.teamsConsentEnabled ?? false;

  const handleToggle = useCallback(
    (value: boolean) => {
      trackConsentUpdated({
        channel: "chat",
        enabled: value,
        snapshot,
        source: "settings",
      });

      setTeamsConsent(value).catch(() => {
        // Apollo's onError link surfaces toasts globally.
      });
    },
    [setTeamsConsent, snapshot],
  );

  const { granted: accessibilityGranted, openSettings } =
    useAccessibilityPermission();

  if (loading || !preferences) return null;

  return (
    <View style={styles.root}>
      <SettingsGroup>
        <SettingField>
          <SettingRow>
            <SettingLabel
              title="Send meeting consent message"
              description={DESCRIPTION}
              id="setting-label-teams-consent"
            />
            <Switch
              value={required || enabled}
              onValueChange={handleToggle}
              disabled={loading || saving || required}
              aria-labelledby="setting-label-teams-consent"
            />
          </SettingRow>
          {required && (
            <Text variant="body2Regular" color="textHint">
              {REQUIRED_BY_ADMIN_MESSAGE}
            </Text>
          )}
          {accessibilityGranted === false && (
            <View style={styles.permissionRow}>
              <Text variant="body2Regular" color="informationStaticRedText">
                Accessibility permission is required for Google Meet and Zoom.
              </Text>
              <Button variant="outlined" size="sm" onPress={openSettings}>
                Grant Permission
              </Button>
            </View>
          )}
          {accessibilityGranted === true && (
            <Text variant="body2Regular" color="informationStaticGreenText">
              Accessibility permission granted.
            </Text>
          )}
        </SettingField>
      </SettingsGroup>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    gap: 12,
  },
  permissionRow: {
    flexDirection: "column",
    gap: 8,
  },
});

import { Button } from "@/components/Button";
import { promptConfirmation } from "@/components/Dialog";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import {
  openSystemExtensionSettings,
  setVirtualCameraEnabled,
  useVirtualCameraStatus,
} from "@/features/camera-consent";
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
import { type FC, useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

const DESCRIPTION =
  'Adds a "Fireflies Watermark" you can pick in Zoom, Google Meet, or Teams. Your video passes through untouched until a recording starts, when a small Fireflies badge appears so other participants can see the meeting is being recorded.';

const READY_HINT =
  'Select "Fireflies Watermark" in your meeting app to use it. You may need to restart the meeting app or browser.';

export const CameraConsentSettings: FC = () => {
  const { status, setStatus } = useVirtualCameraStatus();
  const snapshot = useConsentSnapshot();
  const required = useDesktopConsentPolicy().camera;
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const applyToggle = useCallback(
    async (value: boolean) => {
      trackConsentUpdated({
        channel: "camera",
        enabled: value,
        snapshot,
        source: "settings",
      });

      setBusy(true);
      setFailure(null);
      try {
        const next = await setVirtualCameraEnabled(value);
        if (next) setStatus(next);
      } catch (error) {
        // A rejected IPC call must never leave the switch disabled forever, which
        // reads to the user as a silently frozen control.
        setFailure(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    },
    [setStatus, snapshot],
  );

  const handleToggle = useCallback(
    (value: boolean) => {
      // Turning this off removes the device, so a meeting app currently using
      // it would lose video mid-call.
      if (!value && (status?.consumers ?? 0) > 0) {
        promptConfirmation({
          title: "Turn off the camera notice?",
          children:
            "An app is using the Fireflies Camera right now. Turning this off removes it, and that app will lose video until you pick another camera.",
          confirmText: "Turn off",
          cancelText: "Keep it on",
          onConfirm: () => {
            applyToggle(false);
          },
        });
        return;
      }

      applyToggle(value);
    },
    [applyToggle, status],
  );

  if (!status?.supported) {
    if (status?.unsupportedReason === "not-in-applications") {
      return (
        <View style={styles.root}>
          <SettingsGroup>
            <SettingField>
              <SettingLabel
                title="Show recording notice on camera"
                description={DESCRIPTION}
              />
              <Text variant="body2Regular" color="informationStaticRedText">
                Move Fireflies to your Applications folder to use this. macOS
                only installs camera extensions from apps in /Applications.
              </Text>
            </SettingField>
          </SettingsGroup>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={styles.root}>
      <SettingsGroup>
        <SettingField>
          <SettingRow>
            <SettingLabel
              title="Show recording notice on camera"
              description={DESCRIPTION}
              id="setting-label-camera-consent"
            />
            <Switch
              value={status.installed}
              onValueChange={handleToggle}
              // Turning it on is the fix, so the switch stays live until the
              // device exists; only the off position is the admin's to forbid.
              disabled={busy || (required && status.installed)}
              aria-labelledby="setting-label-camera-consent"
            />
          </SettingRow>

          {required && (
            <Text variant="body2Regular" color="textHint">
              {REQUIRED_BY_ADMIN_MESSAGE}
            </Text>
          )}

          {status.awaitingApproval && (
            <View style={styles.noticeRow}>
              <Text variant="body2Regular" color="informationStaticRedText">
                Approve the Fireflies camera in System Settings to finish
                setting it up.
              </Text>
              <Button
                variant="outlined"
                size="sm"
                onPress={openSystemExtensionSettings}
              >
                Open System Settings
              </Button>
            </View>
          )}

          {status.installed && !status.awaitingApproval && (
            <Text variant="body2Regular" color="informationStaticGreenText">
              {READY_HINT}
            </Text>
          )}

          {/* Whatever macOS said when it refused to install the extension.
              Without this the toggle just fails silently. */}
          {(failure ?? status.lastError) && (
            <Text variant="body2Regular" color="informationStaticRedText">
              Couldn&apos;t set up the Fireflies Camera:{" "}
              {failure ?? status.lastError}
            </Text>
          )}

          {status.installed && status.consumers > 0 && !status.relayHealthy && (
            <Text variant="body2Regular" color="informationStaticRedText">
              The Fireflies Camera stopped responding and is showing a
              placeholder. Restart Fireflies to fix it.
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
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

import { type FC, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useDesktopPermissions } from "@/features/desktop-permissions";
import { PermissionStatusBadge } from "./PermissionStatusBadge";
import { shouldUseCoreAudioTap, getActualPlatform } from "@/utils/device";

export const PermissionSettingsSystemAudio: FC = () => {
  const { permissions, openSettings } = useDesktopPermissions();
  const [useCoreAudioTap, setUseCoreAudioTap] = useState(false);

  useEffect(() => {
    shouldUseCoreAudioTap().then(setUseCoreAudioTap);
  }, []);

  // Windows has no separate system audio permission (WASAPI loopback doesn't require one)
  if (getActualPlatform() === "win32") {
    return null;
  }

  // CoreAudioTap (macOS 14.2+) uses systemAudio permission
  // ScreenCaptureKit (older macOS) uses screen recording permission
  const status = useCoreAudioTap
    ? permissions?.systemAudio
    : permissions?.screen;

  const handlePress = async () => {
    // Both permissions open the same macOS settings page
    // but we use the correct type for proper permission checking
    await openSettings(useCoreAudioTap ? "systemAudio" : "screen");
  };

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="System Audio Recording"
            description="Required to capture audio from meeting apps like Zoom, Teams, and Google Meet."
            id="setting-label-system-audio"
          />
          <PermissionStatusBadge status={status} />
        </SettingRow>
        {status !== "granted" && (
          <Button variant="outlined" size="sm" onPress={handlePress}>
            Open Settings
          </Button>
        )}
      </SettingField>
    </SettingsGroup>
  );
};

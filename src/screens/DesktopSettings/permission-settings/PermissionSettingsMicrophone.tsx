import { type FC } from "react";
import { Button } from "@/components/Button";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useDesktopPermissions } from "@/features/desktop-permissions";
import { PermissionStatusBadge } from "./PermissionStatusBadge";

export const PermissionSettingsMicrophone: FC = () => {
  const { permissions, openSettings, requestPermission } =
    useDesktopPermissions();

  const status = permissions?.microphone;

  const handlePress = async () => {
    if (status === "not-determined") {
      void requestPermission("microphone");
    } else {
      void openSettings("microphone");
    }
  };

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Microphone Access"
            description="Required to capture audio from your meetings for transcription."
            id="setting-label-microphone"
          />
          <PermissionStatusBadge status={status} />
        </SettingRow>
        {status !== "granted" && (
          <Button variant="outlined" size="sm" onPress={handlePress}>
            {status === "not-determined" ? "Grant Access" : "Open Settings"}
          </Button>
        )}
      </SettingField>
    </SettingsGroup>
  );
};

import { Text } from "@/components/Typography";
import type { FC } from "react";
import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { createStyles, useTheme } from "@/styles";
import { Button } from "@/components/Button";
import { RootNavigation } from "@/screens/RootNavigation";
import { RouteNames } from "@/constants";

export const UpdaterInfo: FC = () => {
  const theme = useTheme();
  const [version, setVersion] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    updateAvailable: boolean;
    updateDownloaded: boolean;
    updateInfo: { version: string } | null;
    updateError: string | null;
    selfUpdateSupported: boolean;
  } | null>(null);

  useEffect(() => {
    // Get initial version and status
    const loadInfo = async () => {
      if (window?.electron?.updater) {
        const ver = await window.electron.updater.getVersion();
        const status = await window.electron.updater.getStatus();
        setVersion(ver);
        setUpdateStatus(status);
      }
    };
    void loadInfo();

    // Subscribe to status changes
    if (!window?.electron?.updater) return;

    const unsubscribe = window.electron.updater.onStatusChanged((status) => {
      setUpdateStatus(status);
      setChecking(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window?.electron?.updater) return;

    setChecking(true);
    try {
      await window.electron.updater.checkForUpdates();
      // Status will be updated via the onStatusChanged event
      // The event handler will clear the checking state
    } catch {
      setChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!window?.electron?.updater) return;
    await window.electron.updater.installUpdate();
  };

  if (!window?.electron?.updater) {
    return null;
  }

  const getButtonText = () => {
    if (checking) return "Checking...";
    if (updateStatus?.updateDownloaded) return "Install Update";
    if (updateStatus?.updateAvailable) return "Downloading...";
    return "Check for Updates";
  };

  const getStatusText = () => {
    if (updateStatus?.updateError) {
      return `Error: ${updateStatus.updateError}`;
    }
    if (updateStatus?.updateDownloaded) {
      return `Version ${updateStatus.updateInfo?.version} is ready to install`;
    }
    if (updateStatus?.updateAvailable) {
      return `Update available: ${updateStatus.updateInfo?.version}`;
    }
    return "You're up to date";
  };

  const openDiagnostics = () => {
    RootNavigation.navigate(RouteNames.Diagnostic);
  };

  // A .pkg / MDM install is owned by root, so the app cannot replace its own
  // bundle. Assume updatable until the status loads so the controls don't flash.
  const selfUpdateSupported = updateStatus?.selfUpdateSupported !== false;

  return (
    <View style={styles.updaterContainer}>
      <View style={styles.updaterInfo}>
        <Text variant="body2Regular" color="textPrimary">
          Version {version}
        </Text>
        {selfUpdateSupported && (
          <Text variant="body2Regular" color="textMuted">
            {getStatusText()}
          </Text>
        )}
      </View>
      {selfUpdateSupported && (
        <Button
          variant="secondary"
          size="sm"
          onPress={
            updateStatus?.updateDownloaded
              ? handleInstallUpdate
              : handleCheckForUpdates
          }
          disabled={
            checking ||
            (updateStatus?.updateAvailable && !updateStatus?.updateDownloaded)
          }
        >
          {checking && (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          )}
          <Text variant="body2Weight" color="textPrimary">
            {getButtonText()}
          </Text>
        </Button>
      )}
      <Button variant="secondary" onPress={openDiagnostics} size="sm">
        Diagnostic
      </Button>
    </View>
  );
};

const styles = createStyles({
  updaterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  updaterInfo: {
    flex: 1,
    gap: 4,
  },
});

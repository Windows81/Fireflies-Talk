import { IconCheck, IconMic, IconVideo } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useDesktopPermissions } from "@/features/desktop-permissions";
import { createStyles } from "@/styles";
import { useOnboarding } from "@/screens/DesktopOnboarding/OnboardingContext";
import { DESKTOP_THEME, GLOBAL } from "@/styles/color";
import { shouldUseCoreAudioTap } from "@/utils/device";
import type { PermissionStatus } from "electron/src/types";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { Animated, View } from "react-native";

type PermissionId = "mic" | "screenAudio";

interface PermissionConfig {
  id: PermissionId;
  icon: FC<{ width?: number; height?: number; color?: string }>;
  label: string;
  allowButtonLabel: string;
  openSettingsLabel: string;
}

/**
 * Screen capture is only used on older macOS (< 14.2) via ScreenCaptureKit.
 * macOS 14.2+ uses CoreAudioTap (system audio only), and Windows never captures screen.
 */
const getPermissions = (capturesScreen: boolean): PermissionConfig[] => {
  const items: (PermissionConfig | undefined)[] = [
    {
      id: "mic",
      icon: IconMic,
      label: "Let Fireflies transcribe your voice",
      allowButtonLabel: "Allow Mic Access",
      openSettingsLabel: "Open Settings",
    },
    window.electron?.platform === "darwin"
      ? {
          id: "screenAudio",
          icon: IconVideo,
          label: capturesScreen
            ? "Let Fireflies capture screen and participant voice"
            : "Let Fireflies capture participant voice",
          allowButtonLabel: "Allow Audio Access",
          openSettingsLabel: "Open Settings",
        }
      : undefined,
  ];
  return items.filter((item): item is PermissionConfig => item !== undefined);
};

function isGranted(status: PermissionStatus | undefined): boolean {
  return status === "granted";
}

function isDenied(status: PermissionStatus | undefined): boolean {
  return status === "denied";
}

export const SystemPermissions: FC = () => {
  const { permissions, requestPermission, openSettings, refresh } =
    useDesktopPermissions({ autoCheck: true });
  const { refreshPermissions } = useOnboarding();
  const [useCoreAudioTap, setUseCoreAudioTap] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const capturesScreen =
    useCoreAudioTap === false && window?.electron?.platform === "darwin";
  const permissionItems = getPermissions(capturesScreen);

  useEffect(() => {
    shouldUseCoreAudioTap().then(setUseCoreAudioTap);
  }, []);

  const isReady = permissions !== null && useCoreAudioTap !== null;

  useEffect(() => {
    if (isReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isReady, fadeAnim]);

  // Keep onboarding context in sync so Continue button enables when permissions change
  const syncPermissions = useCallback(() => {
    void refresh().then(() => void refreshPermissions());
  }, [refresh, refreshPermissions]);

  // Refresh when window gains focus so returning from System Settings updates the UI
  useWindowFocus(syncPermissions);

  const micStatus = permissions?.microphone;
  // Consider screenAudio granted if either systemAudio or screen is granted (covers both macOS 14.2+ and older)
  const screenAudioGranted =
    permissions?.systemAudio === "granted" || permissions?.screen === "granted";
  const screenAudioStatus: PermissionStatus | undefined = screenAudioGranted
    ? "granted"
    : useCoreAudioTap
      ? permissions?.systemAudio
      : permissions?.screen;

  const getStatus = (id: PermissionId): PermissionStatus | undefined =>
    id === "mic" ? micStatus : screenAudioStatus;

  const getPermissionType = (
    id: PermissionId,
  ): "microphone" | "screen" | "systemAudio" =>
    id === "mic" ? "microphone" : useCoreAudioTap ? "systemAudio" : "screen";

  const handleAllow = async (id: PermissionId) => {
    // For systemAudio on macOS 14.2+, use the dedicated permission request
    // which triggers the native macOS dialog and waits for the user's response.
    if (id === "screenAudio" && useCoreAudioTap) {
      const status = getStatus(id);
      if (!isGranted(status) && !isDenied(status)) {
        try {
          await window.electron?.audioMonitor?.requestSystemAudioPermission();
        } catch {
          // Permission may have been denied; that's fine
        }
        await refresh();
        await refreshPermissions();
        return;
      }
    }

    const type = getPermissionType(id);
    await requestPermission(type);
    await refresh();
    await refreshPermissions();
  };

  const handleOpenSettings = (id: PermissionId) => {
    const type = getPermissionType(id);
    void openSettings(type);
  };

  if (!isReady) {
    return <View style={styles.optionsContainer} />;
  }

  return (
    <Animated.View style={[styles.optionsContainer, { opacity: fadeAnim }]}>
      {permissionItems.map(
        ({ id, icon: Icon, label, allowButtonLabel, openSettingsLabel }) => {
          const status = getStatus(id);
          const granted = isGranted(status);
          const denied = isDenied(status);
          return (
            <View key={id} style={styles.card}>
              <View style={styles.cardContent}>
                <Icon width={16} height={16} color={DESKTOP_THEME.grey300} />
                <Text variant="body2Weight" numberOfLines={1}>
                  {label}
                </Text>
                {granted ? (
                  <IconCheck
                    width={24}
                    height={24}
                    color={GLOBAL.green500}
                    style={styles.checkIcon}
                  />
                ) : (
                  <Button
                    variant="primary"
                    size="xs"
                    style={styles.allowButton}
                    hoverStyle={styles.allowButtonHover}
                    onPress={() =>
                      denied ? handleOpenSettings(id) : handleAllow(id)
                    }
                  >
                    <Text variant="label2Weight" color="layerContrast">
                      {denied ? openSettingsLabel : allowButtonLabel}
                    </Text>
                  </Button>
                )}
              </View>
            </View>
          );
        },
      )}
    </Animated.View>
  );
};

const styles = createStyles({
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    flex: 1,
    gap: 12,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey900,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    height: 45,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 16,
  },
  iconWrap: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    marginLeft: "auto",
    height: 20,
    width: 20,
  },
  allowButton: {
    backgroundColor: DESKTOP_THEME.purple600,
    borderRadius: 8,
    marginLeft: "auto",
  },
  allowButtonHover: {
    backgroundColor: DESKTOP_THEME.purple500,
  },
});

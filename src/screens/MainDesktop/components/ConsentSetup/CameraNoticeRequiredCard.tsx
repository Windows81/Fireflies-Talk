import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import {
  isVirtualCameraReady,
  openSystemExtensionSettings,
  setVirtualCameraEnabled,
  useVirtualCameraStatus,
} from "@/features/camera-consent";
import {
  closeCameraNoticeGuidance,
  describeCameraNoticeRequirement,
  useDesktopConsentPolicy,
} from "@/features/consent-policy";
import { Logger } from "@/logger";
import { ThemeContext, createStyles, desktopUiTheme, useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import { type FC, useEffect, useEffectEvent, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CAMERA_STEPS } from "./consentCameraSteps";
import { ConsentSetupVisual } from "./ConsentSetupVisual";

const log = new Logger("CameraNoticeRequired");

/**
 * Where a refused recording start sends the member: the team requires the
 * camera notice and this device is not showing it yet. The consent card's
 * camera step with the admin named and without "Start notes anyway": the
 * requirement is the admin's, so the card cannot offer a way around it.
 */
export const CameraNoticeRequiredCard: FC = () => {
  const { breakpoint } = useTheme();
  const theme = useMemo(
    () => ({ ...desktopUiTheme, breakpoint }),
    [breakpoint],
  );
  const { status, setStatus } = useVirtualCameraStatus();
  const required = useDesktopConsentPolicy().camera;
  const [busy, setBusy] = useState(false);
  const requirement = describeCameraNoticeRequirement(
    status,
    getActualPlatform(),
  );
  const ready = isVirtualCameraReady(status);

  // Approval happens outside the app, so the status re-read on window focus
  // is what tells us the member is done.
  const closeWhenReady = useEffectEvent(() => {
    toast({
      type: "success",
      title: "Camera notice is on",
      message: "You can start taking notes.",
    });
    closeCameraNoticeGuidance();
  });
  useEffect(() => {
    if (ready) closeWhenReady();
  }, [ready]);

  // A policy refresh can lift the requirement while the card is open, and its
  // demand is then stale.
  useEffect(() => {
    if (!required) closeCameraNoticeGuidance();
  }, [required]);

  if (!required) return null;

  const setUp = async () => {
    setBusy(true);
    try {
      const next = await setVirtualCameraEnabled(true);
      if (next) setStatus(next);
      // macOS parks the request until the user allows it; take them straight there.
      if (next?.awaitingApproval) openSystemExtensionSettings();
    } catch (error) {
      log.warn("Could not set up the required camera notice", { error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.scrim(theme)}
          onPress={closeCameraNoticeGuidance}
          aria-hidden
        />
        <View style={styles.card(theme)}>
          <ConsentSetupVisual />
          <View style={styles.body}>
            <View style={styles.titles}>
              <Text
                variant="heading4Weight"
                color="textPrimary"
                textAlign="center"
              >
                {requirement.title}
              </Text>
              <Text variant="body2Regular" color="textHint" textAlign="center">
                {requirement.body}
              </Text>
            </View>

            {requirement.showSteps && (
              <View style={styles.steps}>
                {CAMERA_STEPS.map((step, index) => (
                  <View key={step} style={styles.step}>
                    <Text variant="body2Regular" color="textHint">
                      {index + 1}.
                    </Text>
                    <Text variant="body2Regular" color="textSecondary">
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              {requirement.actions.includes("open-system-settings") && (
                <Button
                  variant="outlined"
                  size="md"
                  onPress={openSystemExtensionSettings}
                >
                  Open Login Items & Extensions
                </Button>
              )}
              {requirement.actions.includes("set-up") && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={busy}
                  onPress={setUp}
                >
                  Set up camera
                </Button>
              )}
              {requirement.actions.length === 0 && (
                <Button
                  variant="primary"
                  size="md"
                  onPress={closeCameraNoticeGuidance}
                >
                  OK
                </Button>
              )}
            </View>
          </View>
        </View>
      </View>
    </ThemeContext.Provider>
  );
};

const styles = createStyles({
  // Above the header, which owns the only other z-index on this screen.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scrim: (theme) => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.miscellaneousSkeletonBackground,
    backdropFilter: "blur(3px)",
  }),
  card: (theme) => ({
    width: 520,
    maxHeight: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.layerSubtle,
  }),
  body: {
    paddingTop: 24,
    paddingHorizontal: 48,
    paddingBottom: 48,
    gap: 32,
    alignItems: "center",
  },
  titles: {
    alignItems: "center",
    gap: 4,
    maxWidth: 396,
  },
  steps: {
    alignSelf: "stretch",
    gap: 8,
  },
  step: {
    flexDirection: "row",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
});

import { IconCheck } from "@/assets/svg/svgs.gen";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, GLOBAL, withAlpha } from "@/styles/color";
import { useEffect, useRef, type FC } from "react";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { OnboardingLayout } from "../OnboardingLayout";
import { AccessibilityPermissionVideo } from "../components/AccessibilityPermissionVideo";
import type { OnboardingPermissions } from "../useOnboardingPermissions";

interface PermissionsStepProps {
  onNext: () => void;
  onBack: () => void;
  permissions: OnboardingPermissions;
}

export const PermissionsStep: FC<PermissionsStepProps> = ({
  onNext,
  onBack,
  permissions,
}) => {
  const theme = useTheme();
  const {
    micGranted,
    accessibilityGranted,
    needsAccessibility,
    bothGranted,
    requestMic,
    openAccessibilitySettings,
  } = permissions;

  // Held in a ref because the router rebuilds onNext on every render, which
  // would otherwise restart the timer below before it ever fires.
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  // The last permission granted moves the user on by itself. The short beat
  // lets the row's check register first — accessibility resolves the moment the
  // window regains focus, so leaving System Settings would otherwise land on a
  // screen that changes out from under them.
  useEffect(() => {
    if (!bothGranted) return;
    const timer = setTimeout(() => onNextRef.current(), 700);
    return () => clearTimeout(timer);
  }, [bothGranted]);

  return (
    <OnboardingLayout
      onBack={onBack}
      // The recording is of macOS System Settings, so it only belongs on the
      // platform that actually asks for accessibility.
      rightContent={
        needsAccessibility ? <AccessibilityPermissionVideo /> : undefined
      }
    >
      <View style={styles.content}>
        <Text variant="heading2" color="textPrimary" style={styles.title}>
          {needsAccessibility
            ? "Two quick permissions"
            : "One quick permission"}
        </Text>
        <Text variant="body1Regular" color="textMuted" style={styles.subtitle}>
          {needsAccessibility
            ? "So your words land where your cursor is"
            : "So Talk can hear you"}
        </Text>

        <View style={styles.permissionsList}>
          <View style={styles.permissionRow(theme)}>
            <View style={styles.permissionIcon}>
              <MicIcon color={theme.colors.textSecondary} />
            </View>
            <View style={styles.permissionInfo}>
              <Text variant="body2Regular" color="textSecondary">
                Microphone
              </Text>
              <Text variant="body2Regular" color="textMuted">
                Talk can use your mic to hear you
              </Text>
            </View>
            {micGranted ? (
              <IconCheck width={20} height={20} color={GLOBAL.green500} />
            ) : (
              <Pressable
                onPress={requestMic}
                style={({ pressed }) => [
                  styles.allowButton,
                  pressed && styles.allowButtonPressed,
                ]}
              >
                <Text
                  variant="body2Weight"
                  style={{ color: DESKTOP_THEME.grey100 } as never}
                >
                  Allow
                </Text>
              </Pressable>
            )}
          </View>

          {needsAccessibility && (
            <View style={styles.permissionRow(theme)}>
              <View style={styles.permissionIcon}>
                <AccessibilityIcon color={theme.colors.textSecondary} />
              </View>
              <View style={styles.permissionInfo}>
                <Text variant="body2Regular" color="textSecondary">
                  Accessibility
                </Text>
                <Text variant="body2Regular" color="textMuted">
                  Talk can place text at your cursor
                </Text>
              </View>
              {accessibilityGranted ? (
                <IconCheck width={20} height={20} color={GLOBAL.green500} />
              ) : (
                <Pressable
                  onPress={openAccessibilitySettings}
                  style={({ pressed }) => [
                    styles.allowButton,
                    pressed && styles.allowButtonPressed,
                  ]}
                >
                  <Text
                    variant="body2Weight"
                    style={{ color: DESKTOP_THEME.grey100 } as never}
                  >
                    Allow
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const MicIcon: FC<{ color: string }> = ({ color }) => (
  <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
    <Path
      d="M8 2.66699C7.46957 2.66699 6.96086 2.87771 6.58579 3.25278C6.21071 3.62785 6 4.13656 6 4.66699V10.0003C6 10.5308 6.21071 11.0395 6.58579 11.4145C6.96086 11.7896 7.46957 12.0003 8 12.0003C8.53043 12.0003 9.03914 11.7896 9.41421 11.4145C9.78929 11.0395 10 10.5308 10 10.0003V4.66699C10 4.13656 9.78929 3.62785 9.41421 3.25278C9.03914 2.87771 8.53043 2.66699 8 2.66699Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.6667 8.66699V10.0003C12.6667 11.238 12.175 12.425 11.2999 13.3002C10.4247 14.1753 9.23772 14.667 8.00004 14.667C6.76236 14.667 5.57538 14.1753 4.70021 13.3002C3.82504 12.425 3.33337 11.238 3.33337 10.0003V8.66699"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 14.667V17.3337"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AccessibilityIcon: FC<{ color: string }> = ({ color }) => (
  <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
    <Path
      d="M8 2.83398L8.36914 2.84277C12.1556 3.03489 15.166 6.16673 15.166 10.001C15.1656 13.9585 11.9576 17.1668 8 17.167C4.0424 17.1668 0.833448 13.9585 0.833008 10.001C0.833008 6.04306 4.04213 2.83418 8 2.83398ZM11.1455 10.5C11.0114 12.5105 10.3096 14.4361 9.13379 16.0605C11.8381 15.5579 13.9205 13.2923 14.1445 10.5H11.1455ZM1.85547 10.5C2.07951 13.2918 4.16158 15.5563 6.86523 16.0596C5.68983 14.4354 4.98863 12.5099 4.85449 10.5H1.85547ZM5.8584 10.5C6.00404 12.4761 6.75112 14.3603 7.99902 15.8984C9.24723 14.3602 9.99503 12.4763 10.1406 10.5H5.8584ZM9.13281 3.93848C10.3093 5.56311 11.0114 7.48896 11.1455 9.5H14.1445C13.9202 6.70754 11.8374 4.4408 9.13281 3.93848ZM7.99902 4.10254C6.75132 5.64055 6.00407 7.52408 5.8584 9.5H10.1406C9.99499 7.52374 9.24721 5.64073 7.99902 4.10254ZM6.86621 3.93848C4.16213 4.44128 2.07981 6.708 1.85547 9.5H4.85449C4.9887 7.48919 5.68978 5.56294 6.86621 3.93848Z"
      fill={color}
    />
  </Svg>
);

const styles = createStyles({
  content: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginBottom: 40,
  },
  permissionsList: {
    gap: 16,
  },
  permissionRow: (theme) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.05),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.05),
    gap: 10,
  }),
  // Title line-height is 20, same as the icon, so pinning to the top of the
  // content block lines the icon up with the title rather than the whole row.
  permissionIcon: {
    width: 16,
    height: 20,
    alignSelf: "flex-start" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  permissionInfo: {
    flex: 1,
    gap: 2,
  },
  allowButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: DESKTOP_THEME.purple600,
    cursor: "pointer" as never,
  },
  allowButtonPressed: {
    opacity: 0.8,
  },
});

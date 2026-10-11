import type { FC, RefObject } from "react";
import { Pressable, View } from "react-native";
import { IconWarning, IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import {
  describeCameraNotice,
  dismissCameraNoticeBanner,
  useCameraNoticeBannerDismissed,
  useCameraRecordingPolicy,
} from "@/features/live-record";
import { createStyles, useTheme } from "@/styles";

export const CAMERA_NOTICE_RADIUS = 12;

const MAX_WIDTH = 640;

export const CameraNoticeWarningBanner: FC<{
  glassRef?: RefObject<View | null>;
}> = ({ glassRef }) => {
  const theme = useTheme();
  const policy = useCameraRecordingPolicy();
  const dismissed = useCameraNoticeBannerDismissed();

  if (!policy.noticeMissing || dismissed) return null;

  return (
    <View ref={glassRef} style={styles.banner(theme)} accessibilityRole="alert">
      <View style={styles.iconChip(theme)}>
        <IconWarning
          width={20}
          height={20}
          color={theme.colors.informationStaticYellowText}
          strokeWidth={1.75}
        />
      </View>
      <View style={styles.copy}>
        <Text variant="label1Weight" color="informationStaticYellowText">
          Switch to the &quot;Fireflies Watermark&quot; camera
        </Text>
        <Text
          variant="label2Regular"
          color="informationStaticYellowText"
          style={styles.description}
        >
          {`${describeCameraNotice(policy)} is active, so the recording notice isn't visible to participants.`}
        </Text>
      </View>
      <Pressable
        onPress={dismissCameraNoticeBanner}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={styles.dismiss}
      >
        <IconX
          width={16}
          height={16}
          color={theme.colors.informationStaticYellowText}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
};

const styles = createStyles({
  banner: (theme) => ({
    maxWidth: MAX_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: CAMERA_NOTICE_RADIUS,
    backgroundColor: theme.colors.informationStaticYellowSubtle,
  }),
  iconChip: (theme) => ({
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerDefault,
  }),
  copy: {
    flex: 1,
    gap: 1,
  },
  description: {
    opacity: 0.8,
  },
  dismiss: {
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 4,
    opacity: 0.7,
  },
});

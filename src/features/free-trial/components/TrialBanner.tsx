import { IconArrowRight, IconClose } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { useTrialBanner } from "../useTrialBanner";

const MESSAGE_COLOR = DESKTOP_THEME.grey400; // #D3D4D7
const CTA_COLOR = DESKTOP_THEME.purple400; // #9E99F7
const CLOSE_COLOR = DESKTOP_THEME.grey550; // #6D6E71

export const TrialBanner: FC = () => {
  const banner = useTrialBanner();
  const { isHovered, webHoverProps } = useWebHover();

  if (!banner) return null;

  const { message, ctaLabel, onPress, dismiss } = banner;

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text variant="body2Regular" style={styles.message} numberOfLines={1}>
          {message}
        </Text>
        <Pressable
          {...webHoverProps}
          onPress={onPress}
          accessibilityRole="button"
          style={[styles.cta, isHovered && styles.ctaHover]}
        >
          <Text variant="label2Weight" style={styles.ctaLabel}>
            {ctaLabel}
          </Text>
          <IconArrowRight width={16} height={16} color={CTA_COLOR} />
        </Pressable>
      </View>
      <Pressable
        onPress={dismiss}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={styles.close}
      >
        <IconClose width={16} height={16} color={CLOSE_COLOR} />
      </Pressable>
    </View>
  );
};

const styles = createStyles({
  root: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: DESKTOP_THEME.purple1300,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  message: {
    color: MESSAGE_COLOR,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 20,
  },
  ctaLabel: {
    color: CTA_COLOR,
  },
  ctaHover: {
    opacity: 0.8,
  },
  // Pinned rather than laid out so the message stays optically centred in the
  // window regardless of how wide the close target is.
  close: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
});

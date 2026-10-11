import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { BlurView } from "expo-blur";
import type { FC } from "react";
import { Image, StyleSheet, View } from "react-native";
import bannerBackground from "./dictation-banner-background.jpg";
import {
  DESKTOP_GLASS_BUTTON_HOVER_STYLE,
  DESKTOP_GLASS_BUTTON_STYLE,
} from "./desktopCardStyle";
import { DictationTalkPill } from "./DictationTalkPill";

interface DictationWelcomeBannerProps {
  firstName: string;
  onGetOnboarded: () => void;
}

export const DictationWelcomeBanner: FC<DictationWelcomeBannerProps> = ({
  firstName,
  onGetOnboarded,
}) => {
  return (
    <View style={styles.banner}>
      <Image
        source={bannerBackground}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        alt=""
      />
      {/* Softens the photo so the copy stays legible over the bright horizon. */}
      <BlurView
        intensity={20}
        tint="dark"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.scrim} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.text}>
          <Text variant="title1Weight" color="textPrimary">
            {firstName
              ? `Welcome to Fireflies Talk, ${firstName}`
              : "Welcome to Fireflies Talk"}
          </Text>
          <Text variant="body2Regular" color="textSecondary">
            Learn how to start dictating with Fireflies
          </Text>
        </View>
        <Button
          variant="outlined"
          size="sm"
          style={DESKTOP_GLASS_BUTTON_STYLE}
          hoverStyle={DESKTOP_GLASS_BUTTON_HOVER_STYLE}
          onPress={onGetOnboarded}
          accessibilityLabel="View the Fireflies Talk onboarding"
        >
          View onboarding
        </Button>
      </View>

      <View style={styles.pill} pointerEvents="none">
        <DictationTalkPill />
      </View>
    </View>
  );
};

const styles = createStyles({
  banner: {
    alignSelf: "stretch",
    width: "100%",
    minWidth: 0,
    height: 172,
    maxWidth: 768,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    padding: 28,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(DESKTOP_THEME.grey1200, 0.48),
  },
  content: {
    gap: 24,
    alignItems: "flex-start",
  },
  text: {
    gap: 6,
    alignSelf: "stretch",
  },
  pill: {
    position: "absolute",
    right: 79.5,
    top: "50%",
    transform: [{ translateY: -27.5 }],
  },
});

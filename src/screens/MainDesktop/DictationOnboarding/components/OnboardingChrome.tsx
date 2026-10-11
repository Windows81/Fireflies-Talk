import { IconX } from "@/assets/svg/svgs.gen";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, GLOBAL, withAlpha } from "@/styles/color";
import type { FC } from "react";
import { Image, Pressable, View } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const onboardingBg = require("../assets/onboarding-bg.png");

export const OnboardingBackdrop: FC = () => (
  <>
    <Image source={onboardingBg} style={styles.bgImage} resizeMode="cover" />
    <View style={styles.bgOverlay} />
  </>
);

export const BackArrowIcon: FC<{ color: string }> = ({ color }) => (
  <View style={styles.backArrow}>
    <View style={[styles.backArrowGlyph, { borderColor: color }]} />
  </View>
);

export const OnboardingBackButton: FC<{ onPress: () => void }> = ({
  onPress,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [
        styles.cornerButton,
        styles.cornerLeft,
        pressed && styles.cornerPressed(theme),
      ]}
    >
      <BackArrowIcon color={theme.colors.textMuted} />
    </Pressable>
  );
};

export const OnboardingCloseButton: FC<{ onPress: () => void }> = ({
  onPress,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Skip onboarding"
      style={({ pressed }) => [
        styles.cornerButton,
        styles.cornerRight,
        pressed && styles.cornerPressed(theme),
      ]}
    >
      <IconX width={20} height={20} color={theme.colors.textPrimary} />
    </Pressable>
  );
};

export const ONBOARDING_BACKDROP_COLOR = DESKTOP_THEME.night1000;

const styles = createStyles({
  bgImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%" as const,
    height: "100%" as const,
  },
  bgOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: withAlpha(GLOBAL.black, 0.7),
    backdropFilter: "blur(10px)" as never,
  },
  cornerButton: {
    position: "absolute" as const,
    top: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer" as never,
  },
  cornerLeft: {
    left: 16,
  },
  cornerRight: {
    right: 16,
  },
  cornerPressed: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  backArrow: {
    width: 20,
    height: 20,
  },
  backArrowGlyph: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
    marginLeft: 4,
    marginTop: 4,
  },
});

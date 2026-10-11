import { IconFred } from "@/assets/svg";
import { AnimatedPressable } from "@/components/Animated";
import { GLOBAL } from "@/styles/color";
import { createStyles, useTheme, vars } from "@/styles";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const BUTTON_SIZE = 52;
const ICON_SIZE = 32;
const SPRING_CONFIG = { damping: 200, stiffness: 400 };

export const AskFredButton: FC<{
  onPress: () => void;
}> = ({ onPress }) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => (scale.value = withSpring(0.9, SPRING_CONFIG));
  const handlePressOut = () => (scale.value = withSpring(1, SPRING_CONFIG));

  const isDark = theme.name === "dark";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      aria-label="AskFred"
      style={[
        isDark ? themedStyles.containerDark(theme) : styles.container,
        animatedStyle,
      ]}
    >
      <View style={styles.clippedContent}>
        {isDark ? (
          <View style={themedStyles.iconWrapper}>
            <IconFred width={ICON_SIZE} height={ICON_SIZE} color="white" />
          </View>
        ) : (
          <LinearGradient
            colors={[GLOBAL.fredPurple, GLOBAL.fredLavender]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            <IconFred width={ICON_SIZE} height={ICON_SIZE} color="white" />
          </LinearGradient>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 16,
    ...vars.elevations[2],
  },
  clippedContent: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

const themedStyles = createStyles({
  containerDark: (theme) => ({
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 16,
    backgroundColor: theme.colors.layerStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderInteractiveActive,
    ...vars.elevations[2],
    shadowColor: theme.colors.borderInteractiveActive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  }),
  iconWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

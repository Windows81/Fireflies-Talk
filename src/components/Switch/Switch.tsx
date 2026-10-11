import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, GLOBAL } from "@/styles/color";
import { isDesktop } from "@/utils/device";
import { useEffect, type FC } from "react";
import type { AccessibilityProps } from "react-native";
import { ActivityIndicator, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "dark" | "desktop";
  size?: "md" | "sm";
}

const AnimatedActivityIndicator =
  Animated.createAnimatedComponent(ActivityIndicator);

export const Switch: FC<SwitchProps & AccessibilityProps> = ({
  value,
  onValueChange,
  disabled,
  loading,
  variant = "primary",
  size = "md",
  ...props
}) => {
  const isDesktopVariant = variant === "desktop";
  const isSmall = isDesktopVariant || size === "sm";
  const translateOffset = isSmall ? 12 : 14;

  const offset = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    offset.value = value ? 1 : 0;
  }, [value, offset]);

  const onPress = () => {
    if (disabled || loading) return;
    offset.value = value ? 0 : 1;
    onValueChange(!value);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(offset.value * translateOffset) }],
    };
  }, [translateOffset]);

  const theme = useTheme();

  return (
    // TODO: make this accessible
    <>
      <Pressable
        style={[
          isDesktopVariant
            ? styles.rootDesktop
            : isSmall
              ? styles.rootSmall(theme)
              : styles.root(theme),
          !value && variant === "dark" && styles.rootInactiveDark(theme),
          // Desktop variant: an ON toggle keeps the active color even when
          // locked/disabled (e.g. Tasks) so it reads as ON, not inactive.
          // The disabled treatment is the opacity dim below.
          isDesktopVariant && value && styles.rootActiveDesktop,
          // Standard variants
          !isDesktopVariant &&
            value &&
            (variant === "dark"
              ? styles.rootActiveDark(theme)
              : styles.rootActive(theme)),
          disabled && styles.rootDisabled,
          disabled &&
            value &&
            variant === "dark" &&
            styles.rootLockedOnDark(theme),
        ]}
        onPress={onPress}
        disabled={disabled}
        role="switch"
        aria-checked={value}
        {...props}
      >
        {loading ? (
          <AnimatedActivityIndicator
            style={[
              isSmall ? styles.indicatorSm : styles.indicator,
              animatedStyle,
            ]}
            color="rgba(255, 255, 255, 0.5)"
          />
        ) : (
          <Animated.View
            style={[isSmall ? styles.ballSm : styles.ball, animatedStyle]}
          />
        )}
      </Pressable>
    </>
  );
};

const styles = createStyles({
  root: (theme) => ({
    width: 38,
    height: 24,
    borderRadius: 24,
    backgroundColor: theme.colors.interactiveNeutral3Default,
    position: "relative",
    padding: 4,
  }),
  rootActive: (theme) => ({
    backgroundColor: isDesktop
      ? theme.colors.commandPrimaryHover
      : theme.colors.interactivePrimaryDefault,
  }),
  rootActiveDark: (theme) => ({
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.interactivePrimaryDefault
        : theme.colors.textPrimary,
  }),
  rootInactiveDark: (theme) => ({
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.interactiveNeutral2Default
        : GLOBAL.grey200,
  }),
  rootSmall: (theme) => ({
    width: 32,
    height: 20,
    borderRadius: 20,
    backgroundColor: theme.colors.interactiveNeutral3Default,
    position: "relative",
    padding: 4,
  }),
  indicator: {
    width: 16,
    height: 16,
  },
  ball: {
    width: 16,
    height: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
  },
  rootDisabled: {
    opacity: 0.75,
  },
  rootLockedOnDark: (theme) => ({
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.interactiveNeutral3Default
        : GLOBAL.grey300,
    opacity: 1,
  }),
  rootDesktop: {
    width: 32,
    height: 20,
    borderRadius: 20,
    backgroundColor: DESKTOP_THEME.grey900,
    position: "relative",
    padding: 4,
  },
  rootActiveDesktop: {
    backgroundColor: DESKTOP_THEME.purple600,
  },
  ballSm: {
    width: 12,
    height: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
  },
  indicatorSm: {
    width: 12,
    height: 12,
  },
});

import { createStyles, useTheme, type Theme } from "@/styles";
import type { FC } from "react";
import type {
  AccessibilityProps,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Text } from "@/components/Typography";
import { useWebHover } from "./useWebHover";

type IconButtonVariant =
  | "primary"
  | "primaryTransparent"
  | "neutral"
  | "neutralTransparent"
  | "outlined";

type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  label: string;
  Icon: FC<SvgProps>;
  iconSize?: number;
  iconColor?: keyof Theme["colors"];
  hoverLabel?: string;
}

export const IconButton: FC<
  IconButtonProps & AccessibilityProps & PressableProps
> = (props) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  const {
    label,
    Icon,
    size,
    style,
    disabled,
    variant,
    onPress,
    hoverLabel,
    iconSize,
    iconColor,
    ...restProps
  } = props;

  const {
    pressableStyle,
    iconColor: resolvedIconColor,
    iconSize: resolvedIconSize,
  } = getStyles(
    theme,
    {
      size,
      variant,
      style,
      disabled,
      Icon,
      label,
      iconSize,
      iconColor,
    },
    isHovered,
  );

  return (
    <View style={styles.container}>
      <Pressable
        {...restProps}
        {...webHoverProps}
        onPress={onPress}
        disabled={disabled}
        style={pressableStyle}
        aria-label={restProps["aria-label"] ?? label}
        role="button"
      >
        <Icon
          width={resolvedIconSize}
          height={resolvedIconSize}
          color={resolvedIconColor}
        />
      </Pressable>

      {/* Tooltip for web only */}
      {hoverLabel && Platform.OS === "web" && isHovered && (
        <View style={styles.tooltip(theme)}>
          <Text variant="body2Regular" color="textPrimary" numberOfLines={1}>
            {hoverLabel}
          </Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (
  theme: Theme,
  {
    size = "md",
    disabled,
    style,
    variant = "primary",
    iconSize,
    iconColor,
  }: IconButtonProps,
  isHovered = false,
) => {
  const colorKey =
    iconColor ?? iconColorMap[`${variant}${disabled ? "Disabled" : ""}`];

  return {
    pressableStyle: ({ pressed }: PressableStateCallbackType) => {
      const effectivePressed =
        Platform.OS === "web" ? isHovered || pressed : pressed;

      return [
        baseStyles.root,
        baseStyles[size],
        variantStyles[variant](theme),
        effectivePressed && variantStyles[`${variant}Hover`](theme),
        disabled && variantStyles[`${variant}Disabled`](theme),
        style,
      ];
    },
    iconColor: theme.colors[colorKey],
    iconSize: iconSize ?? iconSizeMap[size],
  };
};

const iconColorMap = {
  primary: "commandContrastDefault",
  primaryDisabled: "commandContrastDisabled",
  primaryTransparent: "commandPrimaryDefault",
  primaryTransparentDisabled: "commandPrimaryDisabled",
  neutral: "commandNeutralDefault",
  neutralDisabled: "commandNeutralDisabled",
  neutralTransparent: "commandNeutralDefault",
  neutralTransparentDisabled: "commandNeutralDisabled",
  outlined: "commandNeutralDefault",
  outlinedDisabled: "commandNeutralDisabled",
} satisfies Record<string, keyof Theme["colors"]>;

const iconSizeMap = {
  xs: 16,
  sm: 20,
  md: 20,
  lg: 24,
};

const baseStyles = StyleSheet.create({
  root: {
    display: "flex",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  xs: {
    width: 24,
    height: 24,
  },
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 36,
    height: 36,
  },
  lg: {
    width: 40,
    height: 40,
  },
});

const variantStyles = createStyles({
  primary: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
  }),
  primaryHover: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryHover,
  }),
  primaryDisabled: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDisabled,
  }),
  primaryTransparent: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutralAlphaDefault,
  }),
  primaryTransparentHover: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  primaryTransparentDisabled: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutralAlphaDefault,
  }),
  neutral: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutralAlphaDefault,
  }),
  neutralHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutralAlphaHover,
  }),
  neutralDisabled: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutralAlphaDefault,
  }),
  neutralTransparent: (theme) => ({
    backgroundColor: theme.colors.borderStaticTransparent,
  }),
  neutralTransparentHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutralAlphaHover,
  }),
  neutralTransparentDisabled: (theme) => ({
    backgroundColor: theme.colors.borderStaticTransparent,
  }),
  outlined: (theme) => ({
    borderWidth: 1,
    borderColor: theme.colors.borderInteractiveDefault,
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
  outlinedHover: (theme) => ({
    borderColor: theme.colors.borderInteractiveHover,
    backgroundColor: theme.colors.interactiveNeutral1Hover,
  }),
  outlinedDisabled: (theme) => ({
    borderColor: theme.colors.borderInteractiveDisabled,
    backgroundColor: theme.colors.interactiveNeutral1Disabled,
  }),
});

const styles = createStyles({
  container: {
    position: "relative",
  },
  tooltip: (theme) => ({
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: [{ translateX: "-50%" }],
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1000,
    maxWidth: 250,
    backgroundColor: theme.colors.layerStrong,
    backdropFilter: "blur(5px)",
  }),
});

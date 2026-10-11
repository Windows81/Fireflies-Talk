import type { Theme } from "@/styles";
import { createStyles } from "@/styles";
import type { PropsWithChildren } from "react";
import type { PressableStateCallbackType } from "react-native";
import { Platform, StyleSheet } from "react-native";
import type { TextProps } from "../Typography";
import type { ButtonProps } from "./types";

export const getStyles = (
  theme: Theme,
  {
    children,
    size = "md",
    variant = "primary",
    disabled,
    style,
    hoverStyle,
    Icon,
  }: PropsWithChildren<ButtonProps>,
  isHovered = false,
) => {
  const iconOnly = !children && !!Icon;

  let textColor =
    textVariantColorMap[`${variant}${disabled ? "Disabled" : ""}`];

  // Use white text for secondary buttons in dark-vibrant theme
  if (theme.name === "dark-vibrant" && variant === "secondary") {
    textColor = disabled ? "commandContrastDisabled" : "commandContrastDefault";
  }

  return {
    pressableStyle: ({ pressed }: PressableStateCallbackType) => {
      const effectivePressed =
        Platform.OS === "web" ? isHovered || pressed : pressed;

      return [
        baseStyles.root,
        baseStyles[size],
        iconOnly && baseStyles.icon,
        iconOnly && baseStyles[`${size}Icon`],
        variantStyles[variant](theme),
        effectivePressed && variantStyles[`${variant}Hover`](theme),
        disabled && variantStyles[`${variant}Disabled`](theme),
        style,
        Platform.OS === "web" && isHovered && hoverStyle,
      ];
    },
    textColor,
    textVariant: (size === "lg"
      ? "label1Weight"
      : "label2Weight") as TextProps["variant"],
    iconOnly,
    iconSize: iconSizeMap[size],
  };
};

const baseStyles = StyleSheet.create({
  root: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 4,
  },
  // size
  xs: {
    minHeight: 32,
    paddingHorizontal: 8,
  },
  xsIcon: {
    height: 32,
    width: 32,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  smIcon: {
    height: 36,
    width: 36,
  },
  md: {
    minHeight: 40,
    paddingHorizontal: 16,
  },
  mdIcon: {
    minHeight: 40,
    width: 40,
  },
  lg: {
    minHeight: 48,
    paddingHorizontal: 20,
  },
  lgIcon: {
    height: 48,
    width: 48,
  },
  icon: {
    paddingHorizontal: 0,
  },
});

const variantStyles = createStyles({
  primary: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
  }),
  primaryHover: (theme) => ({
    backgroundColor: theme.colors.commandPrimaryHover,
  }),
  primaryDisabled: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDisabled,
  }),
  secondary: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
  secondaryHover: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  secondaryDisabled: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDisabled,
  }),
  outlined: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
  }),
  outlinedHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Hover,
  }),
  outlinedDisabled: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Disabled,
    borderColor: theme.colors.borderInteractiveDisabled,
  }),
  transparentPrimary: () => ({
    backgroundColor: "transparent",
  }),
  transparentPrimaryHover: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  transparentPrimaryDisabled: () => ({
    backgroundColor: "transparent",
  }),
  transparentNeutral: () => ({
    backgroundColor: "transparent",
  }),
  transparentNeutralHover: (theme) => ({
    backgroundColor: theme.colors.borderInteractiveHover,
  }),
  transparentNeutralDisabled: () => ({
    backgroundColor: "transparent",
  }),
  danger: (theme) => ({
    backgroundColor: theme.colors.interactiveDangerSecondaryDefault,
  }),
  dangerHover: (theme) => ({
    backgroundColor: theme.colors.interactiveDangerSecondaryHover,
  }),
  dangerDisabled: (theme) => ({
    backgroundColor: theme.colors.interactiveDangerSecondaryDisabled,
  }),
  text: () => ({
    backgroundColor: "transparent",
  }),
  textHover: () => ({
    backgroundColor: "transparent",
  }),
  textDisabled: () => ({
    backgroundColor: "transparent",
  }),
});

const textVariantColorMap = {
  primary: "commandContrastDefault",
  primaryDisabled: "commandContrastDisabled",
  secondary: "commandPrimaryDefault",
  secondaryDisabled: "commandPrimaryDisabled",
  outlined: "commandNeutralDefault",
  outlinedDisabled: "commandNeutralDisabled",
  transparentNeutral: "commandNeutralDefault",
  transparentNeutralDisabled: "commandNeutralDisabled",
  transparentPrimary: "commandPrimaryDefault",
  transparentPrimaryDisabled: "commandPrimaryDisabled",
  text: "commandPrimaryDefault",
  textDisabled: "commandPrimaryDisabled",
  danger: "commandDangerDefault",
  dangerDisabled: "commandDangerDisabled",
} satisfies Record<string, keyof Theme["colors"]>;

export const iconSizeMap = {
  xs: 16,
  sm: 16,
  md: 20,
  lg: 20,
};

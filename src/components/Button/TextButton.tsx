import { useTheme } from "@/styles";
import { useState, type FC } from "react";
import type { AccessibilityProps } from "react-native";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "../Typography";
import { iconSizeMap } from "./styles";
import type { TextButtonProps } from "./types";
import { isDesktop } from "@/utils/device";

/**
 * @deprecated Use `Button` instead.
 */
export const TextButton: FC<
  TextButtonProps & AccessibilityProps & { children?: string }
> = ({
  children,
  size = "md",
  variant = "primary",
  onPress,
  disabled,
  style,
  Icon,
  ...props
}) => {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const textColor =
    textVariantColorMap[
      `${variant}${disabled ? "Disabled" : pressed ? "Hover" : ""}`
    ];
  const iconSize = iconSizeMap[size];

  return (
    <Pressable
      {...props}
      style={[baseStyles.root, baseStyles[size], style]}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      {Icon && (
        <Icon
          width={iconSize}
          height={iconSize}
          color={theme.colors[textColor]}
          strokeWidth={1.5}
        />
      )}
      {!!children && (
        <Text variant={textVariantSizeMap[size]} color={textColor}>
          {children}
        </Text>
      )}
    </Pressable>
  );
};

const baseStyles = StyleSheet.create({
  root: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  sm: {
    minHeight: 16,
  },
  md: {
    minHeight: 20,
  },
  lg: {
    minHeight: 24,
  },
});

const textVariantSizeMap = {
  sm: "label3Weight",
  md: "label2Weight",
  lg: "label1Weight",
} as const;

const textVariantColorMap = {
  primary: isDesktop ? "interactivePrimaryDefault" : "rainbowStaticPurpleSolid",
  primaryHover: "commandPrimaryHover",
  primaryDisabled: "commandPrimaryDisabled",
  secondary: "commandNeutralDefault",
  secondaryHover: "commandNeutralHover",
  secondaryDisabled: "commandNeutralDisabled",
} as const;

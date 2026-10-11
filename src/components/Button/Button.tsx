import { useTheme } from "@/styles";
import type { PropsWithChildren } from "react";
import { forwardRef } from "react";
import type { AccessibilityProps, PressableProps, View } from "react-native";
import { Pressable } from "react-native";
import { Text } from "../Typography";
import { getStyles } from "./styles";
import type { ButtonProps } from "./types";
import { useWebHover } from "./useWebHover";

export const Button = forwardRef<
  View,
  PropsWithChildren<PressableProps & ButtonProps & AccessibilityProps>
>((props, ref) => {
  const {
    children,
    onPress,
    disabled,
    Icon,
    iconSize: customIconSize,
    ...restProps
  } = props;
  const { isHovered, webHoverProps } = useWebHover({
    onHoverIn: restProps.onHoverIn,
    onHoverOut: restProps.onHoverOut,
  });

  const isStringChildren = Array.isArray(children)
    ? !children.some((child) => typeof child === "object")
    : typeof children !== "object";

  const theme = useTheme();

  const { pressableStyle, textColor, textVariant, iconOnly, iconSize } =
    getStyles(theme, props, isHovered);

  return (
    <Pressable
      ref={ref}
      {...restProps}
      {...webHoverProps}
      style={pressableStyle}
      onPress={onPress}
      disabled={disabled}
      role="button"
    >
      {Icon && (
        <Icon
          width={customIconSize ?? iconSize}
          height={customIconSize ?? iconSize}
          color={theme.colors[textColor]}
          strokeWidth={1.5}
        />
      )}
      {isStringChildren && !iconOnly ? (
        <Text color={textColor} variant={textVariant}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
});

Button.displayName = "Button";

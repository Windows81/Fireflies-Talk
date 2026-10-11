import { createStyles, useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";
import { Text } from "../Typography";
import { HoverTooltip } from "../HoverTooltip";

interface MenuItemProps {
  label?: string;
  onPress?: () => void;
  onHoverIn?: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "danger";
  children?: ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
  tooltipPosition?: "top" | "bottom";
}

export const MenuItem: FC<MenuItemProps> = ({
  label,
  onPress,
  onHoverIn,
  icon,
  style,
  variant = "default",
  children,
  disabled = false,
  disabledTooltip,
  tooltipPosition = "top",
}) => {
  const theme = useTheme();

  // If children are provided, render them directly without default styling
  if (children) {
    return (
      <HoverTooltip
        label={disabledTooltip}
        disabled={!disabled}
        position={tooltipPosition}
      >
        <Pressable
          onPress={onPress}
          onHoverIn={onHoverIn}
          accessibilityRole="button"
          style={[styles.menuItem, style]}
          disabled={disabled || !onPress}
        >
          {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
            <View
              style={[
                styles.menuItemContent,
                { width: "100%" },
                pressed && !disabled && styles.menuItemPressed,
                hovered && !disabled && styles.menuItemHovered(theme),
                disabled && disabledTooltip && styles.menuItemDisabled,
              ]}
            >
              {children}
            </View>
          )}
        </Pressable>
      </HoverTooltip>
    );
  }

  return (
    <HoverTooltip
      label={disabledTooltip}
      disabled={!disabled}
      position={tooltipPosition}
    >
      <Pressable
        onPress={onPress}
        onHoverIn={onHoverIn}
        accessibilityRole="button"
        style={[styles.menuItem, style]}
        disabled={disabled}
      >
        {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
          <View
            style={[
              styles.menuItemContent,
              pressed && !disabled && styles.menuItemPressed,
              hovered && !disabled && styles.menuItemHovered(theme),
              disabled && disabledTooltip && styles.menuItemDisabled,
            ]}
          >
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text
              variant="body2Regular"
              color={
                variant === "danger" ? "commandDangerDefault" : "textSecondary"
              }
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </HoverTooltip>
  );
};

const styles = createStyles({
  menuItem: {
    marginHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Hover,
  }),
  icon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
});

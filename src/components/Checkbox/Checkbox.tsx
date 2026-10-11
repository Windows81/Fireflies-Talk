import { IconCheck } from "@/assets/svg";
import { createStyles, useTheme, type Theme } from "@/styles";
import type { FC } from "react";
import type {
  AccessibilityProps,
  StyleProp,
  ViewProps,
  ViewStyle,
} from "react-native";
import { Pressable, View } from "react-native";
import { Text } from "../Typography";

interface CheckboxProps {
  label?: string;
  labelLeft?: React.ReactNode;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Box size in px. Defaults to 20. Check icon scales to ~75% of box. */
  size?: number;
  borderColor?: keyof Theme["colors"];
  /** Overrides the (enabled) label color. Defaults to textSecondary. */
  labelColor?: keyof Theme["colors"];
}

export const Checkbox: FC<
  CheckboxProps &
    AccessibilityProps & {
      pointerEvents?: ViewProps["pointerEvents"];
      nativeID?: string;
    }
> = ({
  label,
  labelLeft,
  value,
  onValueChange,
  disabled,
  style,
  size = 20,
  borderColor,
  labelColor = "textSecondary",
  ...props
}) => {
  const theme = useTheme();
  const iconSize = Math.round(size * 0.75);

  return (
    <Pressable
      style={[
        styles.root,
        disabled && {
          pointerEvents: "none",
        },
        style,
      ]}
      accessible
      role="checkbox"
      aria-checked={value}
      aria-label={label}
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      {...props}
    >
      <View
        style={[
          styles.base(theme),
          { width: size, height: size },
          disabled && styles.disabled(theme),
          value && styles.checked(theme),
          value && disabled && styles.checkedDisabled(theme),
          borderColor && { borderColor: theme.colors[borderColor] },
        ]}
      >
        {value && (
          <IconCheck
            color={
              disabled
                ? theme.colors.commandContrastDisabled
                : theme.colors.commandContrastDefault
            }
            width={iconSize}
            height={iconSize}
          />
        )}
      </View>
      {label && (
        <View style={styles.label}>
          {labelLeft}
          <Text
            color={!disabled ? labelColor : "textDisabled"}
            variant="body2Regular"
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    minHeight: 36,
    paddingVertical: 6,
  },
  base: (theme) => ({
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    backgroundColor: theme.colors.layerDefault,
    alignItems: "center",
    justifyContent: "center",
  }),
  disabled: (theme) => ({
    borderColor: theme.colors.borderInteractiveDisabled,
    backgroundColor: theme.colors.layerDefault,
  }),
  checked: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
    borderColor: theme.colors.interactivePrimaryDefault,
  }),
  checkedDisabled: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDisabled,
    borderColor: theme.colors.interactivePrimaryDisabled,
  }),
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

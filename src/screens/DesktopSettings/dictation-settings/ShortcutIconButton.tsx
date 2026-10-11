import { useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { SvgProps } from "react-native-svg";

interface ShortcutIconButtonProps {
  accessibilityLabel: string;
  Icon: FC<SvgProps>;
  onPress: () => void;
  disabled?: boolean;
}

export const ShortcutIconButton: FC<ShortcutIconButtonProps> = ({
  accessibilityLabel,
  disabled,
  Icon,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
    >
      <Icon width={16} height={16} color={theme.colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 4,
    cursor: "pointer",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
});

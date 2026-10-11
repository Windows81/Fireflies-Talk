import type { Theme } from "@/styles";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";
import type { SvgProps } from "react-native-svg";

export const HeaderIconButton: FC<{
  Icon: FC<SvgProps>;
  label: string;
  onPress?: () => void;
  iconSize?: number;
  color?: keyof Theme["colors"];
}> = ({
  Icon,
  label,
  onPress,
  iconSize = 24,
  color = "commandNeutralDefault",
}) => {
  const theme = useTheme();
  return (
    <TouchableHighlight
      underlayColor={theme.colors.interactiveNeutral1Hover}
      activeOpacity={1}
      style={styles.button}
      aria-label={label}
      onPress={onPress}
      role="button"
    >
      <Icon
        width={iconSize}
        height={iconSize}
        color={theme.colors[color]}
        strokeWidth={2}
      />
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
});

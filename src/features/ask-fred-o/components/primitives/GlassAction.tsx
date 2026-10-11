import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable } from "react-native";
import type { SvgProps } from "react-native-svg";

export const GlassAction: FC<{
  Icon: FC<SvgProps>;
  label: string;
  onPress: () => void;
  active?: boolean;
}> = ({ Icon, label, onPress, active }) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={styles.action}
    >
      <Icon
        width={20}
        height={20}
        color={
          active ? theme.colors.textBrand : theme.colors.commandNeutralDefault
        }
      />
    </Pressable>
  );
};

const styles = createStyles({
  action: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

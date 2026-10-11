import type { Theme } from "@/styles";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import type { AccessibilityProps } from "react-native";
import { View } from "react-native";
import { Text } from "../Typography";
import type { TagProps } from "./Tag";
import { styles } from "./Tag";

export interface StaticTagProps extends Omit<TagProps, "onPress" | "onClear"> {
  color: "gray" | "cyan" | "purple" | "teal" | "orange";
}

export const StaticTag: FC<StaticTagProps & AccessibilityProps> = ({
  children,
  icon,
  color,
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root(theme),
        !!icon && styles.rootWithIcon,
        staticStyles[color](theme),
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        <Text variant="body2Regular" color={textColorMap[color]}>
          {children}
        </Text>
      </View>
    </View>
  );
};

export const staticStyles = createStyles({
  gray: (theme) => ({
    backgroundColor: theme.colors.layerSubtle,
  }),
  cyan: (theme) => ({
    backgroundColor: theme.colors.rainbowStaticCyanSubtle,
  }),
  purple: (theme) => ({
    backgroundColor: theme.colors.rainbowStaticPurpleSubtle,
  }),
  teal: (theme) => ({
    backgroundColor: theme.colors.rainbowStaticTealSubtle,
  }),
  orange: (theme) => ({
    backgroundColor: theme.colors.rainbowStaticOrangeSubtle,
  }),
});

const textColorMap: Record<StaticTagProps["color"], keyof Theme["colors"]> = {
  gray: "textSecondary",
  cyan: "rainbowStaticCyanText",
  purple: "rainbowStaticPurpleText",
  teal: "rainbowStaticTealText",
  orange: "rainbowStaticOrangeText",
};

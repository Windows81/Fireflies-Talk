import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import { BlurView } from "expo-blur";
import type { FC, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

export const GlassPill: FC<
  PropsWithChildren<{ style?: StyleProp<ViewStyle> }>
> = ({ children, style }) => {
  const theme = useTheme();

  return (
    <BlurView
      intensity={24}
      tint={theme.name === "light" ? "light" : "systemThickMaterialDark"}
      style={[styles.pill, style]}
    >
      <View style={styles.fill(theme)}>{children}</View>
    </BlurView>
  );
};

const styles = createStyles({
  pill: {
    borderRadius: 9999,
    overflow: "hidden",
  },
  fill: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: withAlpha(theme.colors.layerContrast, 0.12),
    backgroundColor: withAlpha(theme.colors.layerDefault, 0.4),
  }),
});

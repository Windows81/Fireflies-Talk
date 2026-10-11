import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

export const Separator: FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  const theme = useTheme();
  return <View style={[styles.separator(theme), style]} role="none" />;
};

const styles = createStyles({
  separator: (theme) => ({
    height: 1,
    width: "100%",
    backgroundColor: theme.colors.borderStaticDefault,
  }),
});

import type { FC, PropsWithChildren } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

/**
 * Contains button on headerRight and apply
 * a unified gaps and fix padding inconsistencies
 */
export const HeaderSideContainer: FC<
  PropsWithChildren<{
    forcePadding?: boolean;
    style?: ViewStyle;
  }>
> = ({ children, forcePadding, style }) => {
  return (
    <View
      style={[
        styles.headerRight,
        (forcePadding || Platform.OS === "web") && styles.pad,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
  },
  // tab navigator header and native stack header on web
  // does not have padding on the right
  pad: {
    paddingHorizontal: 8,
  },
});

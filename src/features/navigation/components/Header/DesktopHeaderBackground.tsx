import type React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/styles";

export const DesktopHeaderBackground: React.FC = () => {
  const theme = useTheme();
  return (
    <View
      nativeID="drag-region"
      style={[styles.root, { borderColor: theme.colors.borderStaticSubtle }]}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderBottomWidth: 1,
  },
});

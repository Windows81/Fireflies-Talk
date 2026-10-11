import { DESKTOP_THEME } from "@/styles/color";
import type { FC, PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

interface WelcomeCardProps {
  style?: ViewStyle;
}

export const WelcomeCard: FC<PropsWithChildren<WelcomeCardProps>> = ({
  children,
  style,
}) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: DESKTOP_THEME.grey950,
    borderRadius: 12,
    padding: 20,
    overflow: "hidden",
  },
});

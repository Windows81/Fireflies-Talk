import { useTheme } from "@/styles";
import type { FC, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../Typography";

export interface NumberBadgeProps {
  color: "green" | "yellow" | "red" | "blue";
}

export const NumberBadge: FC<PropsWithChildren<NumberBadgeProps>> = ({
  color,
  children,
}) => {
  const theme = useTheme();

  const colorMaps: Record<NumberBadgeProps["color"], string> = {
    green: theme.colors.informationStaticGreenSolid,
    yellow: theme.colors.informationStaticYellowSolid,
    red: theme.colors.informationStaticRedSolid,
    blue: theme.colors.informationStaticBlueSolid,
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colorMaps[color],
        },
      ]}
    >
      <Text variant="body3Regular" style={styles.text}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#ffffff",
  },
});

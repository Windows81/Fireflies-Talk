import { useTheme } from "@/styles";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "../Typography";
import { isDesktop } from "@/utils/device";

export const LoadingSpinner: FC<{
  color?: string;
}> = ({ color }) => {
  const theme = useTheme();
  return <ActivityIndicator color={color || theme?.colors?.layerBrand} />;
};

export const LoadingScreen: FC<{
  withOverlay?: boolean;
  style?: StyleProp<ViewStyle>;
  title?: string;
}> = ({ withOverlay, style, title }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        withOverlay && {
          backgroundColor: theme.colors.miscellaneousOverlay,
        },
        style,
      ]}
    >
      <LoadingSpinner
        color={
          withOverlay && !isDesktop ? theme.colors.textContrast : undefined
        }
      />
      {!!title && (
        <Text
          variant="title1Weight"
          color={withOverlay && !isDesktop ? "textContrast" : "textPrimary"}
        >
          {title}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});

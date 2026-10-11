import { useTheme } from "@/styles";
import type { FC } from "react";
import { Linking, Pressable, StyleSheet } from "react-native";
import { getCitationMeta } from "../helpers/citationHelpers";

const ICON_SIZE = 13;
const CHIP_SIZE = 20;

type CitationIconProps = {
  href: string;
};

export const CitationIcon: FC<CitationIconProps> = ({ href }) => {
  const theme = useTheme();
  const meta = getCitationMeta(href);

  const handlePress = () => {
    Linking.openURL(href).catch(() => {});
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`Open ${meta.label} source`}
      accessibilityRole="link"
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: pressed
            ? theme.colors.layerStrong
            : theme.colors.layerSubtle,
        },
      ]}
    >
      <meta.Icon width={ICON_SIZE} height={ICON_SIZE} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
  },
});

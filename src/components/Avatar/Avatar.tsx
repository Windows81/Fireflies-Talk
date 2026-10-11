import { createStyles, useTheme } from "@/styles";
import { getReadableTextColor, getUniqueColor } from "@/utils/color";
import { Image } from "expo-image";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Text, View } from "react-native";

export interface AvatarProps {
  name?: string | null;
  picture?: string | null;
  size: 20 | 24 | 32 | 40 | 48;
  style?: StyleProp<ViewStyle>;
  shape?: "circle" | "square";
}

export const Avatar: FC<AvatarProps> = ({
  name = "?",
  picture,
  size,
  style,
  shape = "circle",
}) => {
  const ranColor = picture ? undefined : getUniqueColor(name || "?");
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root(theme),
        shape === "circle"
          ? styles.circle
          : {
              borderRadius: squareBorderRadius[size],
            },
        { width: size, height: size, backgroundColor: ranColor },
        style,
      ]}
      aria-hidden
    >
      {name && !name.includes("Speaker") && (
        <Text
          style={[
            styles.text,
            ranColor && { color: getReadableTextColor(ranColor) },
          ]}
          allowFontScaling={false}
        >
          {name[0]}
        </Text>
      )}
      {picture && (
        <Image
          source={picture}
          style={styles.image}
          contentFit="cover"
          transition={300}
          alt={name || undefined}
        />
      )}
    </View>
  );
};

export const styles = createStyles({
  root: (theme) => ({
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerDefault,
  }),
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  text: {
    color: "#ffffff",
    textTransform: "uppercase",
    fontSize: 12,
    fontWeight: "500",
  },
  circle: {
    borderRadius: 9999,
  },
});

export const squareBorderRadius: Record<number, number> = {
  20: 4,
  24: 4,
  32: 4,
  40: 8,
  48: 8,
};

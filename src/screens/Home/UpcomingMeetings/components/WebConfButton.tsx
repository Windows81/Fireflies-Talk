import { getWebConfIcon } from "@/constants";
import { Image } from "expo-image";
import type { FC } from "react";
import { Linking, Pressable, StyleSheet } from "react-native";

export const WebConfButton: FC<{
  url: string | null | undefined;
  onHoverIn?: () => void;
}> = ({ url, onHoverIn }) => {
  const webConfIcon = getWebConfIcon(url);

  if (!webConfIcon) return null;

  return (
    <Pressable
      onPress={() => {
        Linking.openURL(url as string);
      }}
      onHoverIn={onHoverIn}
    >
      <Image
        source={webConfIcon.src}
        alt={webConfIcon.name}
        style={styles.webConf}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  webConf: {
    width: 20,
    height: 20,
  },
});

import { imageSoundbiteNoVideo } from "@/assets/images";
import type { Soundbite } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { Image } from "expo-image";
import type { FC } from "react";
import { View } from "react-native";
import { SkeletonLoading } from "../Loading";
import { Text } from "../Typography";

export const BiteCardItem: FC<{ bite: Soundbite }> = ({ bite }) => {
  const theme = useTheme();
  return (
    <View style={styles.root(theme)}>
      <Image
        source={bite.thumbnail || imageSoundbiteNoVideo}
        style={styles.image}
        transition={300}
        alt={bite.name}
      />
      <View style={styles.metadata}>
        <Text numberOfLines={1} variant="title3Weight">
          {bite.name}
        </Text>
        <Text numberOfLines={1} variant="body2Regular" color="textHint">
          {bite.createdFrom?.name}
        </Text>
      </View>
    </View>
  );
};

export const LoadingBiteCardItem: FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.root(theme)}>
      <SkeletonLoading width="100%" height={96} />
      <View style={styles.metadata}>
        <SkeletonLoading width="100%" height={20} />
        <SkeletonLoading width="80%" height={20} />
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flexDirection: "column",
    width: 172,
    backgroundColor: theme.colors.layerDefault,
    padding: 4,
    gap: 8,
  }),
  image: {
    width: "100%",
    height: 96,
    borderRadius: 4,
  },
  metadata: {
    gap: 2,
  },
});

import { imageG2Rating } from "@/assets/images";
import { IconStar } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { Image, View } from "react-native";

const STAR_COLOR = "#BF6F06";

export const PitchRating: FC = () => (
  <View style={styles.rating}>
    <Image source={imageG2Rating} style={styles.g2} resizeMode="contain" />
    <Text variant="body3Regular" color="textHint">
      4.8 / 5
    </Text>
    <View style={styles.stars}>
      {[0, 1, 2, 3, 4].map((i) => (
        <IconStar
          key={i}
          width={14}
          height={14}
          color={STAR_COLOR}
          fill={STAR_COLOR}
        />
      ))}
    </View>
  </View>
);

const styles = createStyles({
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  g2: {
    width: 16,
    height: 16,
  },
  stars: {
    flexDirection: "row",
    gap: 3,
  },
});

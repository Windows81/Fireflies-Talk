import { imageSoundbiteNoVideo } from "@/assets/images";
import type { Soundbite } from "@/graphql";
import { toHHMMSS } from "@/utils/time";
import { Image } from "expo-image";
import type { FC } from "react";
import type { AccessibilityProps, StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { SkeletonLoading } from "../Loading";
import { Text } from "../Typography";

export const BiteListItem: FC<
  {
    bite: Soundbite;
    style?: StyleProp<ViewStyle>;
  } & AccessibilityProps
> = ({ bite, style, ...props }) => {
  return (
    <View style={[styles.root, style]} {...props}>
      <View style={styles.videoFrame}>
        <Image
          style={styles.videoImage}
          source={bite.thumbnail || imageSoundbiteNoVideo}
          contentFit="cover"
          transition={300}
          alt={bite.name}
        />
      </View>
      <View style={styles.description}>
        <Text variant="title3Weight" numberOfLines={2} style={styles.name}>
          {bite.name}
        </Text>
        <View style={styles.subMeta}>
          <Text
            variant="body2Regular"
            color="textHint"
            numberOfLines={1}
            style={styles.userName}
          >
            {bite.user?.name}
          </Text>
          <Text variant="body2Regular" color="textHint" numberOfLines={1}>
            {" "}
            · {toHHMMSS(bite.endTime - bite.startTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const UnavailbleBiteListItem: FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.videoFrame}>
        <View style={styles.blankImage} />
      </View>
      <View style={styles.description}>
        <Text
          numberOfLines={2}
          fontSize={14}
          style={styles.name}
          fontWeight="500"
        >
          [Soundbite is not available]
        </Text>
      </View>
    </View>
  );
};

export const LoadingBiteListItem: FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.videoFrame}>
        <SkeletonLoading width="100%" height="100%" />
      </View>
      <View style={styles.description}>
        <SkeletonLoading width={180} height={20} />
        <View style={styles.subMeta}>
          <SkeletonLoading width={100} height={20} />
        </View>
      </View>
    </View>
  );
};

export const BITE_LIST_ITEM_HEIGHT = 116;

const styles = StyleSheet.create({
  root: {
    padding: 16,
    flexDirection: "row",
    gap: 16,
    height: BITE_LIST_ITEM_HEIGHT,
    alignItems: "flex-start",
  },
  videoFrame: {
    width: 132,
    height: 76,
    borderRadius: 4,
    overflow: "hidden",
  },
  videoImage: {
    flex: 1,
  },
  subMeta: {
    flexDirection: "row",
  },
  description: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    flex: 1,
  },
  name: {
    width: "100%",
  },
  userName: {
    flexShrink: 1,
  },
  blankImage: {
    flex: 1,
    backgroundColor: "rgb(32, 33, 36)",
  },
});

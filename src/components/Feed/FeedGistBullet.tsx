import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonLoading } from "../Loading";
import { RNText, Text } from "../Typography";

export const FeedGistBullet: FC<{
  emoji?: string | null;
  title?: string | null;
  sentence: string;
  subtext?: string | null;
}> = ({ emoji, title, sentence, subtext }) => {
  return (
    <View style={styles.item}>
      <Text
        fontSize={emoji ? undefined : 24}
        variant="body1LongRegular"
        color={emoji ? undefined : "textHint"}
      >
        {emoji || "•"}
      </Text>
      <View style={styles.itemContent}>
        <RNText>
          {!!title && <Text variant="body2LongWeight">{title}: </Text>}
          <Text variant="body2LongRegular" color="textSecondary">
            {sentence}
          </Text>
          {!!subtext && (
            <Text variant="body2LongRegular" color="textSecondary">
              {" "}
              {subtext}
            </Text>
          )}
        </RNText>
      </View>
    </View>
  );
};

const loadingNodes = [381, 263, 463];

export const LoadingFeedGistBullet: FC<{ width: number }> = ({ width }) => {
  return (
    <View style={[styles.item, styles.itemLoading]}>
      <Text variant="body1LongRegular" color="textHint" fontSize={24}>
        •
      </Text>
      <View style={styles.itemContent}>
        <SkeletonLoading width={width} height={14} />
      </View>
    </View>
  );
};

export const loadingFeedGistBulletNodes = loadingNodes.map((width, index) => (
  <LoadingFeedGistBullet key={index} width={width} />
));

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 5,
    gap: 20,
    alignSelf: "stretch",
  },
  itemContent: {
    flex: 1,
  },
  itemLoading: {
    alignItems: "center",
  },
});

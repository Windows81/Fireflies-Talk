import { Avatar } from "@/components/Avatar";
import { LinkView } from "@/components/Link";
import { SkeletonLoading } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import type { Soundbite } from "@/graphql";
import { formatPastRelativeTime } from "@/utils/date";
import { toHHMMSS } from "@/utils/time";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const BiteMetadata: FC<{ bite: Soundbite }> = ({ bite }) => {
  return (
    <View style={styles.root}>
      {bite.createdFrom && (
        <LinkView
          style={styles.createdFrom}
          href={{
            pathname: RouteNames.Bite,
            params: { id: bite.createdFrom.id },
          }}
        >
          <Text
            color="textBrand"
            style={styles.createdFromText}
            numberOfLines={1}
            variant="title3Regular"
          >
            {bite.createdFrom.name} ({toHHMMSS(bite.createdFrom.duration || 0)})
          </Text>
        </LinkView>
      )}
      <Text variant="title1Weight" numberOfLines={1}>
        {bite.name}
      </Text>
      <View style={styles.topRow}>
        <View style={styles.user}>
          <Avatar
            size={20}
            name={bite.user?.name}
            picture={bite.user?.picture}
          />
          <Text variant="body2Regular">{bite.user?.name}</Text>
        </View>
        <Text variant="body2Regular" color="textSecondary" aria-hidden>
          {" · "}
        </Text>
        <Text variant="body2Regular" color="textSecondary">
          {formatPastRelativeTime(bite.createdAt)}
        </Text>
      </View>
    </View>
  );
};

export const LoadingBiteMetadata: FC = () => {
  return (
    <View style={styles.root}>
      <SkeletonLoading height={28} width={240} />
      <View style={styles.topRow}>
        <SkeletonLoading height={20} width={100} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    paddingTop: 18,
    paddingBottom: 6,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  createdFrom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  createdFromText: {
    flexShrink: 1,
  },
});

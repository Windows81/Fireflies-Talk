import { IconSoundbite } from "@/assets/svg";
import type { Playlist } from "@/graphql";
import { useTheme } from "@/styles";
import { getUniqueColor } from "@/utils/color";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { SkeletonLoading } from "../Loading";
import { Text } from "../Typography";

export const PlaylistListItem: FC<{
  playlist: Playlist;
  style?: StyleProp<ViewStyle>;
}> = ({ playlist, style }) => {
  const theme = useTheme();
  const ranColor = getUniqueColor(playlist.name);

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.block, { backgroundColor: ranColor }]}>
        <IconSoundbite fill={theme.colors.layerDefault} color={ranColor} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} variant="title2Weight" numberOfLines={2}>
          {playlist.name}
        </Text>
        <Text variant="body2Regular" color="textHint" numberOfLines={1}>
          {playlist.user?.name} · {playlist.count || 0} soundbites
        </Text>
      </View>
    </View>
  );
};

export const LoadingPlaylistListItem: FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.block}>
        <SkeletonLoading width="100%" height="100%" />
      </View>
      <View style={styles.meta}>
        <SkeletonLoading width={180} height={20} variant="rect" />
        <SkeletonLoading width={100} height={16} variant="rect" />
      </View>
    </View>
  );
};

export const PLAYLIST_LIST_ITEM_HEIGHT = 88;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 16,
    flexDirection: "row",
    minHeight: PLAYLIST_LIST_ITEM_HEIGHT,
  },
  block: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  meta: {
    alignItems: "flex-start",
    gap: 4,
    flex: 1,
  },
  name: {
    lineHeight: 20,
  },
});

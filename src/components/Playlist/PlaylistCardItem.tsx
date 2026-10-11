import { IconSoundbite } from "@/assets/svg";
import type { Playlist } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { getUniqueColor } from "@/utils/color";
import { toHrMin } from "@/utils/time";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { Avatar } from "../Avatar";
import { SkeletonLoading } from "../Loading";
import { Text } from "../Typography";

export const PlaylistCardItem: FC<{
  playlist: Playlist;
  style?: StyleProp<ViewStyle>;
}> = ({ playlist, style }) => {
  const ranColor = getUniqueColor(playlist.name);

  const theme = useTheme();

  return (
    <View style={[styles.root, style]}>
      <View
        style={styles.header(theme)}
        aria-label={`Playlist with ${playlist.count || 0} soundbites ${toHrMin(
          playlist.duration || 0,
        )}`}
        role="img"
      >
        <IconSoundbite fill={ranColor} color="#ffffff" />
        <Text color="textHint">
          {playlist.count || 0} soundbites · {toHrMin(playlist.duration || 0)}
        </Text>
      </View>
      <View style={styles.metadata}>
        <Text fontWeight="500" color="textSecondary" numberOfLines={1}>
          {playlist.name}
        </Text>
        <View style={styles.user}>
          <Avatar
            size={20}
            name={playlist.user?.name}
            picture={playlist.user?.picture}
          />
          <Text color="textHint" numberOfLines={1} style={styles.userName}>
            {playlist.user?.name}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const LoadingPlaylistCardItem: FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  return (
    <View style={[styles.root, style]}>
      <SkeletonLoading width="100%" height={96} />
      <View style={styles.metadata}>
        <SkeletonLoading width="100%" height={20} />
        <View style={styles.user}>
          <SkeletonLoading width={20} height={20} variant="circle" />
          <SkeletonLoading width="80%" height={20} />
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    width: 196,
    padding: 4,
    gap: 12,
    maxWidth: "100%",
  },
  metadata: {
    gap: 4,
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userName: {
    flex: 1,
  },
  header: (theme) => ({
    width: "100%",
    height: 96,
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    borderRadius: 8,
    justifyContent: "space-between",
    padding: 16,
  }),
});

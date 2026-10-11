import { AnimatedTouchableHighlight } from "@/components/Animated";
import { Avatar } from "@/components/Avatar";
import { SkeletonLoading } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { usePlayer } from "@/features/player";
import type { MeetingNoteComment } from "@/graphql";
import { useTheme } from "@/styles";
import { formatPastRelativeTime } from "@/utils/date";
import { toHHMMSS } from "@/utils/time";
import type { FC } from "react";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { FadeInDown, FadeOutLeft } from "react-native-reanimated";

export const CommentListItem: FC<{
  comment: MeetingNoteComment;
  openMenu: (comment: MeetingNoteComment) => void;
  isEditing?: boolean;
}> = ({ comment, openMenu, isEditing }) => {
  const { player } = usePlayer();

  const onTimestampPress = useCallback(() => {
    if (typeof comment.timestamp !== "number" || !player) return;
    player.currentTime = comment.timestamp;
  }, [player, comment.timestamp]);

  const theme = useTheme();

  return (
    <AnimatedTouchableHighlight
      underlayColor={theme.colors.layerMuted}
      activeOpacity={1}
      onLongPress={() => openMenu(comment)}
      entering={FadeInDown}
      exiting={FadeOutLeft}
    >
      <View
        style={[
          styles.root,
          isEditing && {
            backgroundColor: theme.colors.informationStaticYellowSubtle,
          },
        ]}
      >
        <View style={styles.header}>
          <Avatar
            size={24}
            name={comment.name}
            picture={comment.picture}
            shape="square"
          />
          <View style={styles.headerMeta}>
            <Text variant="label2Weight" color="textPrimary">
              {comment.name}
            </Text>
            <Text color="textHint" variant="body2Regular" fontSize={8}>
              •
            </Text>
            {typeof comment.timestamp === "number" && (
              <>
                <Text
                  variant="link2Regular"
                  color="informationStaticBlueText"
                  onPress={onTimestampPress}
                >
                  {toHHMMSS(comment.timestamp)}
                </Text>
                <Text color="textHint" variant="body2Regular" fontSize={8}>
                  •
                </Text>
              </>
            )}
            <Text variant="body3Regular" color="textHint">
              {formatPastRelativeTime(comment.createdAt)}
            </Text>
          </View>
        </View>
        <Text
          variant="body2Regular"
          color="textSecondary"
          style={styles.comment}
        >
          {comment.comment}
        </Text>
      </View>
    </AnimatedTouchableHighlight>
  );
};

export const LoadingCommentListItem: FC = () => {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SkeletonLoading width={24} height={24} />
        <View style={styles.headerMeta}>
          <SkeletonLoading width={56} height={24} />
        </View>
      </View>
      <SkeletonLoading width="100%" height={64} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    gap: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
  },
  headerMeta: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  timeAndCreatedAt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comment: {
    maxWidth: "100%",
  },
});

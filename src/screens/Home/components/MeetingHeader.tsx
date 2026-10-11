import { Avatar } from "@/components/Avatar";
import { SkeletonLoading } from "@/components/Loading";
import { MeetingAddedByIcon } from "@/components/Meeting";
import { Text } from "@/components/Typography";
import type { CoreFeedMeetingFieldsFragment } from "@/graphql";
import { format, isSameYear } from "date-fns";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

export const MeetingHeader: FC<{
  meeting: Omit<CoreFeedMeetingFieldsFragment, "summary">;
  style?: StyleProp<ViewStyle>;
}> = ({ meeting, style }) => {
  const isInSameYear = isSameYear(meeting.startTime, new Date());
  const dateFormat = isInSameYear
    ? "E, MMM d · h:mm a"
    : "E, MMM d, yyyy · h:mm a";

  return (
    <View style={[styles.header, style]}>
      <Avatar
        size={32}
        name={meeting.organizerProfile?.name || meeting.organizerEmail}
        picture={meeting.organizerProfile?.picture}
        shape="square"
      />
      <View style={styles.meta}>
        <View style={styles.titleWrapper}>
          <Text variant="title3Weight">{meeting.title}</Text>
          <MeetingAddedByIcon meeting={meeting} iconOnly />
        </View>
        <Text variant="body2Regular" color="textMuted">
          {format(meeting.startTime, dateFormat)}
        </Text>
      </View>
    </View>
  );
};

export const LoadingMeetingHeader: FC = () => {
  return (
    <View style={styles.header}>
      <SkeletonLoading width={32} height={32} variant="rounded" />
      <View style={styles.metaLoading}>
        <SkeletonLoading width={192} height={14} />
        <SkeletonLoading width={124} height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
  },
  meta: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
  },
  metaLoading: {
    flexDirection: "column",
    gap: 4,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 24,
  },
});

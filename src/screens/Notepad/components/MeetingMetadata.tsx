import { Avatar } from "@/components/Avatar";
import { SkeletonLoading } from "@/components/Loading";
import { MeetingAddedByIcon } from "@/components/Meeting";
import { Text } from "@/components/Typography";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { format, isValid } from "date-fns";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { sharedStyles } from "../styles";

const now = new Date();

export const MeetingMetadata: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const isSameYear = meeting.startTime?.getFullYear() === now.getFullYear();

  return (
    <View style={[styles.root, sharedStyles.container]}>
      <View style={styles.row} accessible>
        <Text variant="title1Weight" numberOfLines={1} style={styles.title}>
          {meeting.title}
        </Text>
        <MeetingAddedByIcon meeting={meeting} />
      </View>
      <View style={styles.row}>
        {!!meeting.organizer?.picture && (
          <Avatar
            size={20}
            name={meeting.organizer.name}
            picture={meeting.organizer.picture}
            shape="square"
          />
        )}
        <Text variant="body2Regular" color="textSecondary">
          {meeting.organizer?.name || meeting.organizerEmail} ·{" "}
          {isValid(meeting.startTime) &&
            format(meeting.startTime, isSameYear ? "MMM d" : "MMM d, yyyy")}
          , {isValid(meeting.startTime) && format(meeting.startTime, "h:mm")}{" "}
          {meeting.endTime && format(meeting.endTime, "- h:mm")}
          {isValid(meeting.endTime || meeting.startTime) &&
            format(meeting.endTime || meeting.startTime, "a")}
        </Text>
      </View>
    </View>
  );
};

export const LoadingMeetingMetadata: FC = () => {
  return (
    <View style={[styles.root, sharedStyles.container]}>
      <SkeletonLoading height={28} width={240} />
      <SkeletonLoading height={20} width={100} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    gap: 2,
    paddingTop: 18,
    paddingBottom: 6,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    flexShrink: 1,
  },
});

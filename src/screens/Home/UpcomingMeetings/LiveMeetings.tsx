import type { MeetingStatusData } from "@/graphql";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { LiveMeetingItem } from "./components/LiveMeetingItem";

interface LiveMeetingsProps {
  meetings: MeetingStatusData[];
}

export const LiveMeetings: FC<LiveMeetingsProps> = ({ meetings }) => {
  return (
    <View style={styles.root}>
      {meetings.map((meeting) => (
        <LiveMeetingItem key={meeting.objectId} meeting={meeting} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 20,
    flexDirection: "column",
  },
});

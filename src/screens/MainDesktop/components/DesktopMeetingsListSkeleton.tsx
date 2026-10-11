import { SkeletonLoading } from "@/components/Loading";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

const MEETING_ROW_COUNT = 5;

export const DesktopMeetingsListSkeleton: FC = () => (
  <View style={styles.list}>
    <View style={styles.dayGroup}>
      <View style={styles.dayHeader}>
        <SkeletonLoading width={88} height={20} variant="rounded" />
      </View>
      <View style={styles.dayMeetings}>
        {Array.from({ length: MEETING_ROW_COUNT }).map((_, index) => (
          <View key={index} style={styles.meetingRow}>
            <SkeletonLoading width={32} height={32} variant="rounded" />
            <View style={styles.meetingText}>
              <SkeletonLoading width="72%" height={20} variant="rounded" />
              <SkeletonLoading width={56} height={16} variant="rounded" />
            </View>
          </View>
        ))}
      </View>
    </View>
  </View>
);

const styles = createStyles({
  list: {
    alignSelf: "stretch",
  },
  dayGroup: {
    alignSelf: "stretch",
  },
  dayHeader: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dayMeetings: {
    gap: 4,
    alignSelf: "stretch",
  },
  meetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  meetingText: {
    flex: 1,
    gap: 4,
  },
});

import { SkeletonLoading } from "@/components/Loading";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

const BULLET_ROWS = 8;

export const MeetingPrepBodySkeleton: FC = () => {
  return (
    <View style={styles.root}>
      {Array.from({ length: BULLET_ROWS }).map((_, i) => (
        <View key={i} style={styles.bulletRow}>
          <SkeletonLoading width={20} height={20} variant="rounded" />
          <View style={styles.bulletTextColumn}>
            <SkeletonLoading width="60%" height={14} />
            <SkeletonLoading width="100%" height={12} />
            <SkeletonLoading width="80%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = createStyles({
  root: {
    gap: 18,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletTextColumn: {
    flex: 1,
    gap: 6,
  },
});

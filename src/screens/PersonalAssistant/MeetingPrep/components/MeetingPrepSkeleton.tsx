import { SkeletonLoading } from "@/components/Loading";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { useWindowDimensions, View } from "react-native";

const DAY_BUTTON_WIDTHS = [80, 70, 70, 70];
const BULLET_ROWS = 8;

export const MeetingPrepSkeleton: FC = () => {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.85;

  return (
    <View style={styles.root}>
      <View style={styles.dayButtonsRow}>
        {DAY_BUTTON_WIDTHS.map((width, i) => (
          <SkeletonLoading key={i} width={width} height={32} />
        ))}
      </View>

      <View style={styles.meetingCardRow}>
        <View style={[styles.meetingCard(theme), { width: cardWidth }]}>
          <View style={styles.meetingCardLeft}>
            <SkeletonLoading width={70} height={14} />
            <SkeletonLoading width="70%" height={16} />
            <SkeletonLoading width={60} height={14} />
          </View>
          <SkeletonLoading width={38} height={24} variant="rounded" />
        </View>
      </View>

      <View style={styles.separator(theme)} />

      <View style={styles.sourceHeader}>
        <SkeletonLoading width={70} height={14} />
        <View style={styles.sourceRow(theme)}>
          <SkeletonLoading width="55%" height={16} />
          <SkeletonLoading width={90} height={14} />
        </View>
      </View>

      <View style={styles.body}>
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
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  dayButtonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  meetingCardRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  meetingCard: (theme) => ({
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.layerMuted,
  }),
  meetingCardLeft: {
    flex: 1,
    gap: 8,
  },
  separator: (theme) => ({
    height: 1,
    backgroundColor: theme.colors.borderStaticDefault,
    marginTop: 12,
  }),
  sourceHeader: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sourceRow: (theme) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  }),
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
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

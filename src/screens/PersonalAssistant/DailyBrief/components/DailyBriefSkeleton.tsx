import { SkeletonLoading } from "@/components/Loading";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

const DAY_BUTTON_WIDTHS = [70, 62, 58, 58, 58];
const BULLET_ROWS = 10;

export const DailyBriefSkeleton: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.dayButtonsRow}>
        {DAY_BUTTON_WIDTHS.map((width, i) => (
          <SkeletonLoading key={i} width={width} height={32} />
        ))}
      </View>

      <View style={styles.dayHeader}>
        <View style={styles.separatorLine(theme)} />
        <SkeletonLoading width={160} height={14} />
        <View style={styles.separatorLine(theme)} />
      </View>

      <View style={styles.body}>
        <SkeletonLoading width={180} height={18} />
        <View style={styles.section}>
          <SkeletonLoading width={160} height={20} />
          {Array.from({ length: BULLET_ROWS }).map((_, i) => (
            <View key={i} style={styles.bulletRow}>
              <SkeletonLoading width={6} height={6} variant="circle" />
              <View style={styles.bulletTextColumn}>
                <SkeletonLoading width="100%" height={12} />
                <SkeletonLoading width="80%" height={12} />
              </View>
            </View>
          ))}
        </View>
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
    paddingBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  separatorLine: (theme) => ({
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderStaticDefault,
  }),
  body: {
    paddingHorizontal: 20,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 6,
  },
  bulletTextColumn: {
    flex: 1,
    gap: 6,
  },
});

import { SkeletonLoading } from "@/components/Loading";
import { ShimmerText, Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { taskRowStyles } from "./taskRowStyles";

const TITLE_WIDTHS = ["72%", "58%", "81%", "64%"] as const;

// Matches SummaryProcessing: shimmering status copy above skeleton rows so the
// tab doesn't feel empty while action items are still generating.
export const NotepadTasksSkeleton: FC = () => (
  <View style={styles.root}>
    <View style={styles.header}>
      <ShimmerText variant="body1Weight">
        Tasks are being generated…
      </ShimmerText>
      <Text variant="body2Regular" color="textMuted">
        It may take a few minutes to analyze the meeting and generate the tasks
      </Text>
    </View>
    <View style={styles.list}>
      {TITLE_WIDTHS.map((width, index) => (
        <View key={index} style={taskRowStyles.row}>
          <View style={taskRowStyles.checkboxWrap}>
            <View style={styles.checkbox}>
              <SkeletonLoading width="100%" height="100%" variant="rect" />
            </View>
          </View>
          <View style={styles.title}>
            <SkeletonLoading width={width} height={16} />
          </View>
        </View>
      ))}
    </View>
  </View>
);

const styles = createStyles({
  root: {
    gap: 32,
  },
  header: {
    gap: 8,
  },
  list: {
    minWidth: 0,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    overflow: "hidden",
  },
  title: {
    flex: 1,
    paddingTop: 6,
    minWidth: 0,
  },
});

import { SkeletonLoading } from "@/components/Loading";
import { ShimmerText, Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import type { DimensionValue } from "react-native";
import { View } from "react-native";

// Widths of the skeleton lines under each placeholder section header.
const SECTION_LINE_WIDTHS: DimensionValue[] = ["100%", "92%", "70%"];
const SECTION_COUNT = 3;

// Shown while the meeting summary is (re)generating. Mirrors dashboard-ff's
// processing state: a shimmering status line plus skeleton section placeholders
// so the layout doesn't collapse while we poll for the fresh summary.
export const SummaryProcessing: FC = () => (
  <View style={styles.root}>
    <View style={styles.header}>
      <ShimmerText variant="body1Weight">
        Meeting summary is processing…
      </ShimmerText>
      <Text variant="body2Regular" color="textMuted">
        It may take a few minutes to analyze the transcript and generate the
        meeting summary.
      </Text>
    </View>

    <View style={styles.sections}>
      {Array.from({ length: SECTION_COUNT }).map((_, section) => (
        <View key={section} style={styles.section}>
          <SkeletonLoading width={160} height={16} />
          {SECTION_LINE_WIDTHS.map((width, line) => (
            <SkeletonLoading key={line} width={width} height={12} />
          ))}
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
  sections: {
    gap: 28,
  },
  section: {
    gap: 12,
  },
});

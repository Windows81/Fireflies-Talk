import { Text, type TextProps } from "@/components/Typography";
import { toHHMMSS } from "@/utils/time";
import type { FC } from "react";
import { StyleSheet } from "react-native";
import { useRecorder } from "../record.store";

/**
 * Self-contained component that renders the recording duration
 * using a zustand selector so only this component re-renders
 * when durationMillis changes (~every 500ms).
 */
export const RecordingDurationText: FC<Omit<TextProps, "children">> = ({
  style,
  ...props
}) => {
  const durationMillis = useRecorder((s) => s.status.durationMillis);

  return (
    <Text {...props} style={[styles.tabular, style]}>
      {/* mm:ss until the recording crosses an hour, then hh:mm:ss. */}
      {toHHMMSS(Math.ceil(durationMillis / 1000))}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Fixed-width digits so the timer doesn't jiggle as it counts.
  tabular: {
    fontVariant: ["tabular-nums"],
  },
});

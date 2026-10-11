import { createStyles } from "@/styles";
import { useEffect, useMemo, type FC } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const CYCLE_DURATION = 900;

export type PillWaveformGeometry = {
  barCount: number;
  barWidth: number;
  barGap: number;
  minHeight: number;
  maxHeight: number;
};

/** Live bar default: seven chunky bars in a 16px band. */
export const LIVE_BAR_WAVEFORM: PillWaveformGeometry = {
  barCount: 7,
  barWidth: 2,
  barGap: 2,
  minHeight: 2,
  maxHeight: 16,
};

// Hand-tuned so neighbouring bars never fall into visible lockstep. Cycles for
// bar counts beyond its length.
const PHASE_OFFSETS = [0, 0.18, 0.36, 0.54, 0.72, 0.46, 0.24];

type BarProps = {
  index: number;
  level: SharedValue<number>;
  progress: SharedValue<number>;
  color: string;
  geometry: PillWaveformGeometry;
};

const Bar: FC<BarProps> = ({ index, level, progress, color, geometry }) => {
  const { minHeight, maxHeight } = geometry;
  const phase = PHASE_OFFSETS[index % PHASE_OFFSETS.length];
  const animatedStyle = useAnimatedStyle(() => {
    const osc = 0.5 + 0.5 * Math.sin((progress.value + phase) * 2 * Math.PI);
    return { height: minHeight + (maxHeight - minHeight) * level.value * osc };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          width: geometry.barWidth,
          borderRadius: geometry.barWidth / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Waveform shown in the collapsed live pill and in the dictation pill. The bars
 * ripple in proportion to `level` (0-1, e.g. transcript activity or real mic
 * amplitude) and fall flat at 0.
 */
export const PillWaveform: FC<{
  color: string;
  level: number;
  geometry?: PillWaveformGeometry;
}> = ({ color, level: targetLevel, geometry = LIVE_BAR_WAVEFORM }) => {
  const level = useSharedValue(0);
  const progress = useSharedValue(0);
  const bars = useMemo(
    () => Array.from({ length: geometry.barCount }, (_, index) => index),
    [geometry.barCount],
  );

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  useEffect(() => {
    level.value = withTiming(targetLevel, { duration: 280 });
  }, [targetLevel, level]);

  return (
    <View
      testID="drag"
      style={[
        styles.root,
        { gap: geometry.barGap, height: geometry.maxHeight },
      ]}
    >
      {bars.map((index) => (
        <Bar
          key={index}
          index={index}
          level={level}
          progress={progress}
          color={color}
          geometry={geometry}
        />
      ))}
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {},
});

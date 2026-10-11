import { useIsTranscribing } from "@/screens/Live/RealtimePanel/hooks/useIsTranscribing";
import { createStyles } from "@/styles";
import { useEffect, type FC } from "react";
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

const BAR_COUNT = 7;
const BAR_WIDTH = 2;
const BAR_GAP = 2;
const MIN_HEIGHT = 2;
const MAX_HEIGHT = 16;

// Continuous oscillation so active transcription reads as a moving wave, not a
// static block. Each bar is offset along the cycle to ripple across the row.
const CYCLE_DURATION = 900;
const PHASE_OFFSETS = [0, 0.18, 0.36, 0.54, 0.72, 0.46, 0.24];

type BarProps = {
  index: number;
  level: SharedValue<number>;
  progress: SharedValue<number>;
  color: string;
};

const Bar: FC<BarProps> = ({ index, level, progress, color }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const phase = PHASE_OFFSETS[index % PHASE_OFFSETS.length];
    const osc = 0.5 + 0.5 * Math.sin((progress.value + phase) * 2 * Math.PI);
    const height = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * level.value * osc;
    return { height };
  });

  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color }, animatedStyle]}
    />
  );
};

/**
 * Waveform shown in the collapsed live pill. The bars ripple while people are
 * speaking — driven by live-transcript activity — and fall flat when the
 * transcript goes idle (silence, paused, or ended).
 */
export const PillWaveform: FC<{ color: string }> = ({ color }) => {
  const isTranscribing = useIsTranscribing();

  const level = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  useEffect(() => {
    level.value = withTiming(isTranscribing ? 1 : 0, { duration: 280 });
  }, [isTranscribing, level]);

  return (
    <View testID="drag" style={styles.root}>
      {PHASE_OFFSETS.slice(0, BAR_COUNT).map((_, index) => (
        <Bar
          key={index}
          index={index}
          level={level}
          progress={progress}
          color={color}
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
    gap: BAR_GAP,
    height: MAX_HEIGHT,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
});

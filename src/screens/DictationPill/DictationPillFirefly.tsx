import type { Theme } from "@/styles";
import { meterColor } from "./dictationPillStyles";
import { useEffect, type FC } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PERIOD_MS = 1400;
const METER = {
  horizontal: { width: 26, height: 16, orbitX: 9, orbitY: 5 },
  vertical: { width: 20, height: 26, orbitX: 6, orbitY: 9 },
};

/** The box the sparks orbit inside. The meter's is a flattened ellipse. */
export type FireflyOrbit = {
  width: number;
  height: number;
  orbitX: number;
  orbitY: number;
};

type SparkProps = {
  progress: SharedValue<number>;
  phase: number;
  size: number;
  color: string;
  glow: boolean;
  width: number;
  height: number;
  orbitX: number;
  orbitY: number;
};

const Spark: FC<SparkProps> = ({
  progress,
  phase,
  size,
  color,
  glow,
  width,
  height,
  orbitX,
  orbitY,
}) => {
  const style = useAnimatedStyle(() => {
    const turn = (progress.value + phase) * Math.PI * 2;
    const flash = 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(turn));
    return {
      opacity: flash,
      transform: [
        { translateX: Math.cos(turn) * orbitX },
        { translateY: Math.sin(turn) * orbitY },
        { scale: 0.8 + 0.35 * flash },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: (width - size) / 2,
          top: (height - size) / 2,
          boxShadow: glow ? `0 0 10px ${color}` : undefined,
        },
        style,
      ]}
    />
  );
};

export const DictationPillFirefly: FC<{
  theme: Theme;
  vertical: boolean;
  /** Fn+Shift: the pill itself is purple-to-pink, so brand orbs vanish in it. */
  isAction?: boolean;
  /** Overrides the meter's ellipse — the action orb rings a circle instead. */
  orbit?: FireflyOrbit;
}> = ({ theme, vertical, isAction, orbit }) => {
  const progress = useSharedValue(0);
  const meter = orbit ?? (vertical ? METER.vertical : METER.horizontal);
  // On the action pill every orb burns the same white as the meter's bars,
  // which is the only thing that reads against that gradient.
  const pink = isAction
    ? meterColor
    : theme.colors.rainbowInteractivePinkDefault;
  const purple = isAction ? meterColor : theme.colors.rainbowStaticPurpleSolid;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: PERIOD_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const spark = {
    progress,
    width: meter.width,
    height: meter.height,
    orbitX: meter.orbitX,
    orbitY: meter.orbitY,
  };

  return (
    <View
      pointerEvents="none"
      style={{ width: meter.width, height: meter.height }}
    >
      <Spark {...spark} phase={0} size={5} color={pink} glow />
      <Spark {...spark} phase={-0.1} size={3.5} color={pink} glow={false} />
      <Spark {...spark} phase={-0.2} size={2.5} color={pink} glow={false} />
      <Spark {...spark} phase={0.52} size={4} color={purple} glow />
    </View>
  );
};

const styles = StyleSheet.create({
  spark: {
    position: "absolute",
  },
});

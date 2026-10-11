import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { createStyles } from "@/styles";
import { GLOBAL } from "@/styles/color";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const NUM_DOTS = 7;
const DOT_ANGLE_STEP = 360 / NUM_DOTS; // ~51.43 degrees
const RADIUS = 7; // Distance from center
const CENTER_X = 9.185; // Half of 18.37
const CENTER_Y = 9; // Half of 18
const DOT_SIZE = 3.56;
const DOT_HALF = DOT_SIZE / 2;

// Gradient start/end points for the 132deg rainbow fill.
const GRADIENT_ANGLE = (132 * Math.PI) / 180;
const GRADIENT_START_X = 0.5 - 0.5 * Math.cos(GRADIENT_ANGLE);
const GRADIENT_START_Y = 0.5 - 0.5 * Math.sin(GRADIENT_ANGLE);
const GRADIENT_END_X = 0.5 + 0.5 * Math.cos(GRADIENT_ANGLE);
const GRADIENT_END_Y = 0.5 + 0.5 * Math.sin(GRADIENT_ANGLE);

/**
 * Rotating ring of seven rainbow-gradient dots — the app's "AI is working"
 * loading indicator. Shared by the live "Writing your notes" indicator and the
 * notepad "Polishing your notes" pill.
 */
export const CircularLoadingDot: FC = () => {
  const rotation = useSharedValue(0);
  const startTime = useSharedValue<number | null>(null);

  useFrameCallback((frameInfo) => {
    if (startTime.value === null) {
      startTime.value = frameInfo.timestamp;
      return;
    }
    const elapsed = frameInfo.timestamp - startTime.value;
    // One full rotation every 2s — slow, smooth.
    rotation.value = (elapsed / 2000) * 360;
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dots = Array.from({ length: NUM_DOTS }, (_, index) => {
    const baseAngle = (DOT_ANGLE_STEP * index * Math.PI) / 180;
    const x = CENTER_X + RADIUS * Math.cos(baseAngle) - DOT_HALF;
    const y = CENTER_Y + RADIUS * Math.sin(baseAngle) - DOT_HALF;
    return { x, y, index };
  });

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.dotWrapper, containerAnimatedStyle]}>
        {dots.map(({ x, y, index }) => (
          <AnimatedLinearGradient
            key={index}
            colors={[GLOBAL.aiGradientLime, GLOBAL.aiGradientCyan]}
            start={{ x: GRADIENT_START_X, y: GRADIENT_START_Y }}
            end={{ x: GRADIENT_END_X, y: GRADIENT_END_Y }}
            style={[styles.dot, { position: "absolute", left: x, top: y }]}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = createStyles({
  dotContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dotWrapper: {
    width: 18.37,
    height: 18,
    position: "relative",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_HALF,
  },
});

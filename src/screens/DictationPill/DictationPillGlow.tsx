import type { Theme } from "@/styles";
import type { DictationPillSide } from "electron/src/types";
import { useEffect, type FC } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  isDictationPillVertical,
  PILL_BEZIER,
  PILL_THICKNESS,
} from "./dictationPillMode";
import {
  SETTLE_WARMTH_DELAY_MS,
  SETTLE_WARMTH_MS,
} from "./dictationPillSettle";
import { blurFilter, radialGradient } from "./dictationPillStyles";
import type { DictationPillStir } from "./useDictationPillStir";

const SLIDE_EASING = Easing.bezier(...PILL_BEZIER);

const LANTERN_SIZE = 48;
// The shell's own fill (design 16b) added a vertical gradient and a bevel,
// so the lantern's radial glow now has real background contrast to read
// through rather than a flat, uniform dark surface. Raised to hold the same
// visible punch it had before that fill existed.
const LANTERN_OPACITY = 0.75;
/** From the seam to the middle of either half. */
const LANTERN_SHIFT = (PILL_THICKNESS + 1) / 2;
const LANTERN_SLIDE_MS = 500;
const LANTERN_FADE_MS = 600;

const HALO_LENGTH = 70;
const HALO_THICKNESS = 15;
const HALO_OPACITY = 0.45;
const HALO_WARMTH = 0.5;
const HALO_BLUR = "blur(8px)";
const HALO_FADE_MS = 500;

/** Which half of the launcher the cursor is over. */
export type LitHalf = "leading" | "trailing" | null;

/**
 * The lantern inside the open launcher. It sits on the seam and slides to
 * whichever half the cursor is over, lighting Dictate or Notes from within.
 */
export const PillLanternGlow: FC<{
  active: boolean;
  half: LitHalf;
  vertical: boolean;
  theme: Theme;
}> = ({ active, half, vertical, theme }) => {
  const shift = useSharedValue(0);
  const fade = useSharedValue(active ? LANTERN_OPACITY : 0);

  useEffect(() => {
    shift.value = withTiming(halfOffset(half), {
      duration: LANTERN_SLIDE_MS,
      easing: SLIDE_EASING,
    });
  }, [half, shift]);

  useEffect(() => {
    fade.value = withTiming(active ? LANTERN_OPACITY : 0, {
      duration: LANTERN_FADE_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [active, fade]);

  const style = useAnimatedStyle(() => {
    const offset = shift.value * LANTERN_SHIFT;
    return {
      opacity: fade.value,
      transform: [
        { translateX: vertical ? 0 : offset },
        { translateY: vertical ? offset : 0 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.lantern,
        radialGradient(
          `circle, ${theme.colors.dictationPillLanternInner}, ${theme.colors.dictationPillLanternOuter} 45%, transparent 70%`,
        ),
        style,
      ]}
    />
  );
};

function halfOffset(half: LitHalf): number {
  switch (half) {
    case "leading":
      return -1;
    case "trailing":
      return 1;
    case null:
      return 0;
    default: {
      const _exhaustive: never = half;
      return _exhaustive;
    }
  }
}

/**
 * The halo the resting nub casts on the screen behind it as the cursor nears,
 * and the warmth left on the edge as a landed session comes home. It lives
 * outside the shell's clip, so it is laid over the host window at the nub's
 * own centre rather than inside the pill.
 */
export const PillNearHalo: FC<{
  /** Only the nub casts it; the halo fades as the pill takes another shape. */
  visible: boolean;
  /** A session is coming home: the edge glows warm, the last thing to go. */
  warm: boolean;
  side: DictationPillSide;
  stir: DictationPillStir;
  theme: Theme;
}> = ({ visible, warm, side, stir, theme }) => {
  const shown = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    shown.value = withTiming(visible ? 1 : 0, {
      duration: HALO_FADE_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [visible, shown]);

  // The warmth comes a beat late and, once the settle lets go, is the last
  // thing to fade.
  const warmth = useSharedValue(0);
  useEffect(() => {
    warmth.value = withDelay(
      SETTLE_WARMTH_DELAY_MS,
      withTiming(warm ? 1 : 0, {
        duration: SETTLE_WARMTH_MS,
        easing: Easing.inOut(Easing.ease),
      }),
    );
  }, [warm, warmth]);

  // Read as its own binding: a shared value reached through an object is not
  // tracked as a dependency, so the style would never follow the cursor.
  const { near } = stir;
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(
      1,
      near.value * HALO_OPACITY * shown.value + warmth.value * HALO_WARMTH,
    ),
  }));

  const vertical = isDictationPillVertical(side);
  const width = vertical ? HALO_THICKNESS : HALO_LENGTH;
  const height = vertical ? HALO_LENGTH : HALO_THICKNESS;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.halo,
        {
          width,
          height,
          left: stir.centre.x - width / 2,
          top: stir.centre.y - height / 2,
        },
        radialGradient(
          `ellipse at center, ${theme.colors.dictationPillHaloInner}, ${theme.colors.dictationPillHaloOuter} 50%, transparent 75%`,
        ),
        blurFilter(HALO_BLUR),
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  lantern: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: LANTERN_SIZE,
    height: LANTERN_SIZE,
    marginLeft: -LANTERN_SIZE / 2,
    marginTop: -LANTERN_SIZE / 2,
    borderRadius: LANTERN_SIZE / 2,
  },
  halo: {
    position: "absolute",
    borderRadius: HALO_LENGTH / 2,
  },
});

import { useCallback } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/** Travel of the first nudge in px; later passes decay from here. */
const AMPLITUDE = 5;
const STEP_MS = 55;

/**
 * A short, decaying horizontal nudge. Draws the eye to something the user has
 * to deal with before continuing, without the alarm of a full error state.
 */
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = useCallback(() => {
    const step = (to: number) =>
      withTiming(to, { duration: STEP_MS, easing: Easing.out(Easing.quad) });

    // Re-assigning mid-shake restarts it, so repeated presses keep nudging.
    translateX.value = withSequence(
      step(-AMPLITUDE),
      step(AMPLITUDE),
      step(-AMPLITUDE / 2),
      step(AMPLITUDE / 2),
      step(0),
    );
  }, [translateX]);

  return { style, shake };
};

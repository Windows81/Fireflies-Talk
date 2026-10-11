import type { FC } from "react";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

interface RevealWordProps {
  word: string;
  /** Whether the word should be on screen. */
  visible: boolean;
  /** Wait before fading in, so words can land one after another. */
  delayMs?: number;
  fadeMs: number;
  /** How long the word takes to drop out; 0 hides it at once. */
  hideMs: number;
}

/**
 * One word of a sentence that fades in on its turn. It is always laid out, so
 * the text around it never reflows when it appears. Unheard words are mounted
 * too, so the demo that renders these must describe itself to assistive tech
 * instead of exposing the words.
 */
export const RevealWord: FC<RevealWordProps> = ({
  word,
  visible,
  delayMs = 0,
  fadeMs,
  hideMs,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = visible
      ? withDelay(delayMs, withTiming(1, { duration: fadeMs }))
      : withTiming(0, { duration: hideMs });
  }, [visible, delayMs, fadeMs, hideMs, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.Text style={animatedStyle}>{word} </Animated.Text>;
};

import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import {
  getDictationPillSize,
  type DictationPillMode,
  type DictationPillMorph,
} from "./dictationPillMode";
import {
  LAYER_FADE_DELAY_MS,
  LAYER_FADE_MS,
  LAYER_MOVE_MS,
  LAYER_REST_BLUR_PX,
  LAYER_REST_SCALE,
  PILL_EASING,
} from "./dictationPillStyles";

// Width, height, radius and blur are all layout/filter props, so none of these
// can run on the native driver.
const TIMING = { useNativeDriver: false } as const;

/** Animates the shell between the pill's shapes, at the pace the move asks for. */
export function useDictationPillMorph(
  mode: DictationPillMode,
  vertical: boolean,
  /** This move's pace and curve, shared with everything riding in the shell. */
  morph: DictationPillMorph,
) {
  const target = getDictationPillSize(mode, vertical);
  const { duration, bezier, radiusMs, delayMs } = morph;
  const width = useRef(new Animated.Value(target.width)).current;
  const height = useRef(new Animated.Value(target.height)).current;
  const radius = useRef(new Animated.Value(target.radius)).current;

  useEffect(() => {
    const easing = Easing.bezier(...bezier);
    const animation = Animated.parallel([
      Animated.timing(width, {
        toValue: target.width,
        duration,
        delay: delayMs,
        easing,
        ...TIMING,
      }),
      Animated.timing(height, {
        toValue: target.height,
        duration,
        delay: delayMs,
        easing,
        ...TIMING,
      }),
      Animated.timing(radius, {
        toValue: target.radius,
        duration: radiusMs,
        delay: delayMs,
        easing: radiusMs === duration ? easing : Easing.out(Easing.ease),
        ...TIMING,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [
    target.width,
    target.height,
    target.radius,
    duration,
    bezier,
    radiusMs,
    delayMs,
    width,
    height,
    radius,
  ]);

  return { width, height, borderRadius: radius };
}

/** How a layer goes: over how long, to what size, and how far out of focus. */
export type PillLayerLeave = { ms: number; scale: number; blurPx: number };

const SWAP_LEAVE: PillLayerLeave = {
  ms: LAYER_FADE_MS,
  scale: LAYER_REST_SCALE,
  blurPx: LAYER_REST_BLUR_PX,
};

/**
 * Cross-fade for one of the shell's stacked layers. By default the outgoing
 * layer sits back — smaller and defocused — while the incoming one fades in
 * slightly late, so the swap reads as depth rather than as two views trading
 * places. A layer can be told to leave otherwise: slower, or swelling.
 */
export function useDictationPillLayer(
  active: boolean,
  leave: PillLayerLeave = SWAP_LEAVE,
  /** How long an arriving layer waits before it starts to show. */
  enterDelayMs: number = LAYER_FADE_DELAY_MS,
) {
  const fade = useRef(new Animated.Value(active ? 1 : 0)).current;
  const move = useRef(new Animated.Value(active ? 1 : 0)).current;

  // The leave arrives on the very render that deactivates the layer — a
  // landing session's meter is told to breathe out as it goes — so it is read
  // straight from the prop, not from a copy taken while the layer was showing.
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fade, {
        toValue: active ? 1 : 0,
        duration: active ? LAYER_FADE_MS : leave.ms,
        delay: active ? enterDelayMs : 0,
        easing: Easing.out(Easing.ease),
        ...TIMING,
      }),
      Animated.timing(move, {
        toValue: active ? 1 : 0,
        duration: active ? LAYER_MOVE_MS : Math.max(LAYER_MOVE_MS, leave.ms),
        delay: active ? enterDelayMs - LAYER_FADE_DELAY_MS : 0,
        easing: PILL_EASING,
        ...TIMING,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [active, leave.ms, leave.scale, leave.blurPx, enterDelayMs, fade, move]);

  return {
    opacity: fade,
    scale: move.interpolate({
      inputRange: [0, 1],
      outputRange: [leave.scale, 1],
    }),
    blur: fade.interpolate({
      inputRange: [0, 1],
      outputRange: [`blur(${leave.blurPx}px)`, "blur(0px)"],
    }),
  };
}

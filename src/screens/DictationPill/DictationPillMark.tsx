import { IconLogo } from "@/assets/svg";
import { useEffect, useRef, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  SETTLE_DELAY_MS,
  type DictationPillMode,
  type DictationPillMorph,
} from "./dictationPillMode";
import { SETTLE_MARK_FADE_MS } from "./dictationPillSettle";
import {
  ACTION_SKIN_FADE_MS,
  CENTRE_SNAP_BIAS,
  LAYER_FADE_DELAY_MS,
  LAYER_FADE_MS,
  MARK_SIZE,
  METER_MARK_OFFSET,
  meterColor,
} from "./dictationPillStyles";

type Props = {
  mode: DictationPillMode;
  vertical: boolean;
  /** Fn+Shift: the gradient mark would vanish into the action pill's purple, so it goes white. */
  isAction: boolean;
  /** The shell's own move, so the mark slides as the shape settles. */
  morph: DictationPillMorph;
  /** A session is coming home: the mark softens away slowly, in place. */
  settling: boolean;
};

/**
 * The one mark the pill ever shows. It sits beside the meter while a session
 * runs and, when the un-minimized pill comes to rest, slides to the centre
 * rather than a second copy fading in where the first faded out. Away from
 * those shapes it is gone, leaving the embers to stand in for it.
 */
export const DictationPillMark: FC<Props> = ({
  mode,
  vertical,
  isAction,
  morph,
  settling,
}) => {
  const shown = mode === "resting" || mode === "dictating";
  const offset = mode === "dictating" ? METER_MARK_OFFSET : 0;

  const shift = useSharedValue(offset);
  const fade = useSharedValue(shown ? 1 : 0);
  const wasShown = useRef(shown);

  // The morph is rebuilt every render, so the effect keys on its stable fields.
  const { duration, bezier, delayMs } = morph;
  useEffect(() => {
    const appearing = shown && !wasShown.current;
    wasShown.current = shown;
    // A disappearing mark fades where it stands; an appearing one fades in
    // where it belongs rather than sliding in from wherever it last was. Only
    // a mark that stays visible travels.
    if (!shown) return;
    if (appearing) {
      shift.value = offset;
      return;
    }
    shift.value = withDelay(
      delayMs,
      withTiming(offset, { duration, easing: Easing.bezier(...bezier) }),
    );
  }, [shown, offset, duration, bezier, delayMs, shift]);

  useEffect(() => {
    // Arrives a beat late, like the layers, so the swap reads as depth. A
    // landed session lets it dissolve slowly into the embers instead, in step
    // with the shell.
    const leaving = !shown && settling;
    const delay = shown ? LAYER_FADE_DELAY_MS : leaving ? SETTLE_DELAY_MS : 0;
    fade.value = withDelay(
      delay,
      withTiming(shown ? 1 : 0, {
        duration: leaving ? SETTLE_MARK_FADE_MS : LAYER_FADE_MS,
        easing: Easing.inOut(Easing.ease),
      }),
    );
  }, [shown, settling, fade]);

  // The action skin fades out over a beat after a command finishes. The white
  // mark stays until it has gone, or the gradient would sink into the purple.
  const [solid, setSolid] = useState(isAction);
  if (isAction && !solid) setSolid(true);
  useEffect(() => {
    if (isAction) return;
    const timer = setTimeout(() => setSolid(false), ACTION_SKIN_FADE_MS);
    return () => clearTimeout(timer);
  }, [isAction]);

  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateX: vertical ? 0 : shift.value },
      { translateY: vertical ? shift.value : 0 },
    ],
  }));

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Animated.View style={[styles.mark, style]}>
        <IconLogo
          width={MARK_SIZE}
          height={MARK_SIZE}
          solidColor={solid ? meterColor : undefined}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: StyleSheet.absoluteFillObject,
  // Anchored at the shell's centre, a hair off the rounding boundary; the
  // transform carries it to the meter.
  mark: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: MARK_SIZE,
    height: MARK_SIZE,
    marginLeft: -MARK_SIZE / 2 + CENTRE_SNAP_BIAS,
    marginTop: -MARK_SIZE / 2 + CENTRE_SNAP_BIAS,
  },
});

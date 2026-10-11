import type { Theme } from "@/styles";
import type {
  DictationPillBackdrop,
  DictationPillSide,
} from "electron/src/types";
import { useEffect, type FC } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  EMBER_DOUSE_MS,
  EMBER_FADE_MS,
  EMBER_IGNITE_MS,
  EMBER_LAND_MS,
  EMBER_STAGGER_MS,
  EMBERS,
  emberDepth,
  emberLift,
  emberOffset,
  placeEmber,
  placeEmberOrbit,
  type EmberSpec,
} from "./dictationPillEmberGeometry";
import {
  getDictationPillSize,
  isDictationPillVertical,
  SETTLE_DELAY_MS,
  type DictationPillMode,
  type DictationPillMorph,
} from "./dictationPillMode";
import { SETTLE_EMBER_FADE_MS, SETTLE_STAGGER_MS } from "./dictationPillSettle";
import {
  dockedEdgeAnchor,
  METER_MARK_OFFSET,
  METER_WAVE_OFFSET,
} from "./dictationPillStyles";
import type { DictationPillStir } from "./useDictationPillStir";

/** How much brighter an ember burns as it surfaces from a landed session. */
const SURFACE_LIFT = 0.45;
const SURFACE_GLOW = 0.8;
/**
 * Over a light backdrop the idle shell goes translucent and lighter, and the
 * muted resting embers lose the dark ground they were tuned against. They
 * burn this much brighter there so the dots stay in view.
 */
const LIGHT_BACKDROP_LIFT = 0.35;
const LIGHT_BACKDROP_FADE_MS = 250;

type Props = {
  mode: DictationPillMode;
  side: DictationPillSide;
  theme: Theme;
  stir: DictationPillStir;
  /** The shell's own move, so the flock lands as the shape settles. */
  morph: DictationPillMorph;
  /** A session is coming home: the embers surface among the sparks and drift. */
  settling: boolean;
  /** What the pill floats over; resting embers burn brighter over light. */
  backdrop: DictationPillBackdrop;
};

/**
 * The pill's four fireflies. Minimized, they rest muted and still in a row
 * inside the nub and stir as the cursor nears. Un-minimized, they
 * hide in the four cells of the mark. When the launcher opens they simply go
 * out where they are — nothing of theirs enters its middle, where the divider
 * stands — and when a session starts they dive into the mark, one cell each,
 * and go out. Dark, they wait along the meter's spark orbit; when the session lands
 * they surface among the fading sparks and drift home, each on its own
 * diagonal.
 */
export const DictationPillEmbers: FC<Props> = ({
  mode,
  side,
  theme,
  stir,
  morph,
  settling,
  backdrop,
}) => {
  // Surfacing, the embers burn brighter than rest for as long as the settle
  // holds, then dim to their muted glow.
  const surface = useSharedValue(0);
  useEffect(() => {
    surface.value = withTiming(settling ? 1 : 0, {
      duration: SETTLE_EMBER_FADE_MS,
      easing: Easing.inOut(Easing.ease),
    });
  }, [settling, surface]);

  const light = useSharedValue(backdrop === "light" ? 1 : 0);
  useEffect(() => {
    light.value = withTiming(backdrop === "light" ? 1 : 0, {
      duration: LIGHT_BACKDROP_FADE_MS,
      easing: Easing.inOut(Easing.ease),
    });
  }, [backdrop, light]);

  const vertical = isDictationPillVertical(side);
  const lift = emberLift(side);
  const depth = useEmberDepth(mode, side, morph);
  const tones = {
    pink: theme.colors.rainbowInteractivePinkDefault,
    purple: theme.colors.rainbowStaticPurpleSolid,
  };

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Animated.View style={[styles.anchor, dockedEdgeAnchor(side)]}>
        {EMBERS.map((spec, index) => (
          <Ember
            key={index}
            index={index}
            spec={spec}
            color={tones[spec.tone]}
            mode={mode}
            vertical={vertical}
            lift={lift}
            depth={depth}
            surface={surface}
            light={light}
            stir={stir}
            morph={morph}
            settling={settling}
          />
        ))}
      </Animated.View>
    </View>
  );
};

/**
 * Where the shell's centre line sits relative to the docked edge, moving as
 * the shell does — same pace, curve and delay — so the flock stays centred in
 * it without ever being laid out inside it.
 */
function useEmberDepth(
  mode: DictationPillMode,
  side: DictationPillSide,
  morph: DictationPillMorph,
) {
  const vertical = isDictationPillVertical(side);
  const size = getDictationPillSize(mode, vertical);
  const target = emberDepth(side, vertical ? size.width : size.height);
  const x = useSharedValue(target.x);
  const y = useSharedValue(target.y);
  const { duration, bezier, delayMs } = morph;
  useEffect(() => {
    const move = { duration, easing: Easing.bezier(...bezier) };
    x.value = withDelay(delayMs, withTiming(target.x, move));
    y.value = withDelay(delayMs, withTiming(target.y, move));
  }, [target.x, target.y, duration, bezier, delayMs, x, y]);
  return { x, y };
}

type EmberProps = {
  index: number;
  spec: EmberSpec;
  color: string;
  mode: DictationPillMode;
  vertical: boolean;
  lift: { x: number; y: number };
  depth: { x: SharedValue<number>; y: SharedValue<number> };
  surface: SharedValue<number>;
  /** 1 over a light backdrop, 0 over a dark one. */
  light: SharedValue<number>;
  stir: DictationPillStir;
  morph: DictationPillMorph;
  settling: boolean;
};

const Ember: FC<EmberProps> = ({
  index,
  spec,
  color,
  mode,
  vertical,
  lift,
  depth,
  surface,
  light,
  stir,
  morph,
  settling,
}) => {
  const place = placeEmber(mode, index, METER_MARK_OFFSET);
  const target = emberOffset(place, vertical);
  const lit = place.lit ? 1 : 0;
  // A session's ember dives into the mark, goes dark, and then — unseen —
  // takes up its spot on the spark orbit, ready to surface there when the
  // session lands.
  const orbit =
    mode === "dictating"
      ? emberOffset(placeEmberOrbit(index, METER_WAVE_OFFSET), vertical)
      : null;
  // The nub, and the launcher it opens into, are the jar shut: the embers keep
  // their resting size there and simply dim in place as the launcher opens.
  // Elsewhere the jar is open and they burn at full size.
  const opened = mode === "hidden" || mode === "open" ? 0 : 1;

  const x = useSharedValue(target.x);
  const y = useSharedValue(target.y);
  const open = useSharedValue(opened);
  const burn = useSharedValue(lit);

  // The morph is rebuilt every render — and the pill re-renders on every mic
  // level — so the effect keys on its two stable fields, not on the object.
  const { duration, bezier } = morph;
  // The launcher opening is the exception: the embers have nowhere to go, so
  // they are doused on the spot, quickly, before the buttons come.
  const dousing = mode === "open";
  useEffect(() => {
    const beat = index * (settling ? SETTLE_STAGGER_MS : EMBER_STAGGER_MS);
    // Lighting up, an ember catches where it is and then flies; going out, it
    // lands first and dims in place. Settling, it surfaces already drifting,
    // a beat after it sets off.
    const moveDelay = beat + (lit && !settling ? EMBER_IGNITE_MS : 0);
    const burnDelay = dousing
      ? 0
      : beat + (settling ? SETTLE_DELAY_MS : lit ? 0 : EMBER_LAND_MS);
    const fadeMs = dousing
      ? EMBER_DOUSE_MS
      : settling
        ? SETTLE_EMBER_FADE_MS
        : EMBER_FADE_MS;
    const move = { duration, easing: Easing.bezier(...bezier) };
    // The orbit spot is taken only once the ember has landed and gone dark.
    const travel = (to: number, park: number | undefined) =>
      park === undefined
        ? withTiming(to, move)
        : withSequence(
            withTiming(to, move),
            withDelay(
              Math.max(0, burnDelay + fadeMs - moveDelay - duration),
              withTiming(park, { duration: 0 }),
            ),
          );
    x.value = withDelay(moveDelay, travel(target.x, orbit?.x));
    y.value = withDelay(moveDelay, travel(target.y, orbit?.y));
    open.value = withDelay(moveDelay, withTiming(opened, move));
    burn.value = withDelay(
      burnDelay,
      withTiming(lit, { duration: fadeMs, easing: Easing.out(Easing.ease) }),
    );
  }, [
    target.x,
    target.y,
    orbit?.x,
    orbit?.y,
    opened,
    lit,
    duration,
    bezier,
    settling,
    dousing,
    index,
    x,
    y,
    open,
    burn,
  ]);

  // Own bindings, not `stir.near.value`: a shared value reached through an
  // object is not tracked as a dependency of the style.
  const { near: stirNear, lean: stirLean } = stir;
  const { x: depthX, y: depthY } = depth;
  const style = useAnimatedStyle(() => {
    // The cursor only stirs an ember at rest, and not while a landed session
    // is still coming home: a hand resting on the pill would otherwise nudge
    // the drifting embers with every small move.
    const rest = (1 - open.value) * (1 - surface.value);
    const near = stirNear.value * rest;
    const lean = stirLean.value * rest * spec.lean;
    return {
      opacity:
        Math.min(
          1,
          0.35 +
            0.65 * open.value +
            near * 0.35 +
            surface.value * SURFACE_LIFT +
            light.value * LIGHT_BACKDROP_LIFT * rest,
        ) * burn.value,
      // The half-size centring rides in the transform too: a layout offset of
      // a pixel and a half would be snapped to a whole one, and differently
      // depending on what else is painting.
      transform: [
        {
          translateX:
            depthX.value +
            x.value +
            (vertical ? 0 : lean) +
            lift.x * near * spec.lift -
            spec.size / 2,
        },
        {
          translateY:
            depthY.value +
            y.value +
            (vertical ? lean : 0) +
            lift.y * near * spec.lift -
            spec.size / 2,
        },
        { scale: 0.85 + 0.45 * open.value + near * 0.15 },
      ],
    };
  });

  // The glow is a fixed shadow on its own layer and only its opacity moves, so
  // a frame never re-rasterizes the shadow of a three-pixel dot — that
  // shimmered as the embers drifted.
  const glowStyle = useAnimatedStyle(() => {
    const rest = (1 - open.value) * (1 - surface.value);
    const near = stirNear.value * rest;
    return {
      opacity:
        Math.min(1, open.value + near * 0.5 + surface.value * SURFACE_GLOW) *
        burn.value,
    };
  });

  const dot = {
    width: spec.size,
    height: spec.size,
    borderRadius: spec.size / 2,
    backgroundColor: color,
  };

  return (
    <Animated.View style={[styles.dot, dot, style]}>
      <Animated.View
        style={[
          styles.glow,
          {
            borderRadius: dot.borderRadius,
            boxShadow: `0 0 ${spec.glow}px ${color}`,
          },
          glowStyle,
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: StyleSheet.absoluteFillObject,
  // The one fixed point on the docked edge that every ember hangs from.
  anchor: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  // Laid out at the anchor itself; the transform alone carries each dot to the
  // shell's centre and on to its place, and scales it about its own middle.
  dot: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  glow: StyleSheet.absoluteFillObject,
});

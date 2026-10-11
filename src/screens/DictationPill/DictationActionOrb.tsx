import { IconAlertCircle, IconCheck, IconClose } from "@/assets/svg";
import type { Theme } from "@/styles";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, type FC } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { actionOrbFace, type ActionJob } from "./dictationActionJob";
import { DictationActionGlow } from "./DictationActionGlow";
import { ACTION_ORB_SIZE, orbStyles } from "./dictationActionOrbStyles";
import {
  DictationPillFirefly,
  type FireflyOrbit,
} from "./DictationPillFirefly";
import {
  ACTION_GRADIENT_END,
  ACTION_GRADIENT_LOCATIONS,
  ACTION_GRADIENT_START,
  actionGradientColors,
  meterColor,
  webkitNoDrag,
} from "./dictationPillStyles";

/**
 * A wide orbit rings the circle and leaves a hole in the middle of it. The
 * sparks are the whole content here, so they turn tightly at the centre
 * instead.
 */
const ORB_ORBIT: FireflyOrbit = {
  width: ACTION_ORB_SIZE,
  height: ACTION_ORB_SIZE,
  orbitX: 6,
  orbitY: 6,
};

const ORB_ICON_SIZE = 15;
/**
 * Slow enough to watch the division happen. This is the one moment that
 * explains where the orb came from, so it is paced to be read rather than to
 * get out of the way.
 */
const FLIGHT_MS = 2400;
/**
 * The orb buds off the pill the way a cell divides: it swells out of the pill
 * as a small bead, pinches free, glides over, and settles with one soft
 * overshoot. The stops below are that sequence — nothing here is a plain
 * point-to-point tween, which reads as a sprite being moved rather than as the
 * pill producing something.
 */
const BUD = [0, 0.12, 0.32, 0.82, 1];
const BUD_SCALE = [0.05, 0.34, 0.62, 1.06, 1];
const BUD_OPACITY = [0, 0.9, 1, 1, 1];
/**
 * How much of the trip is left at each stop. Both axes are driven from this one
 * set of fractions, which is what keeps the path a straight line from the pill
 * to the slot — two independently tuned axes drift into a curve.
 */
const BUD_REMAINING = [1, 1, 0.62, 0.04, 0];

/** Where the orb starts its flight, relative to the slot it lands in. */
export type OrbFlight = { dx: number; dy: number };

/**
 * One detached action. It wears action mode's own purple-to-pink gradient so it
 * reads as the same surface the pill shows while a command runs — and it flies
 * out of the pill to its corner so the hand-off is visible rather than implied.
 *
 * Hovering it opens the run's panel; that is where a result is copied. The orb
 * itself only reports where the run is up to, and offers the X that clears it.
 */
export const DictationActionOrb: FC<{
  job: ActionJob;
  theme: Theme;
  hovered: boolean;
  /** Null once the pill's position is unknown — the orb simply appears. */
  flight: OrbFlight | null;
  onDismiss: (job: ActionJob) => void;
  onHoverChange: (hovered: boolean) => void;
}> = ({ job, theme, hovered, flight, onDismiss, onHoverChange }) => {
  const face = actionOrbFace(job);
  // Captured once: the slot moves as siblings come and go, and re-reading it
  // would restart the trip from wherever the row has since shuffled to.
  const origin = useRef(flight);
  const travel = useRef(new Animated.Value(origin.current ? 0 : 1)).current;

  useEffect(() => {
    if (!origin.current) return;
    const animation = Animated.timing(travel, {
      toValue: 1,
      duration: FLIGHT_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [travel]);

  const from = origin.current;
  const flightStyle = from
    ? {
        opacity: travel.interpolate({
          inputRange: BUD,
          outputRange: BUD_OPACITY,
        }),
        transform: [
          {
            translateX: travel.interpolate({
              inputRange: BUD,
              outputRange: BUD_REMAINING.map((left) => from.dx * left),
            }),
          },
          {
            translateY: travel.interpolate({
              inputRange: BUD,
              outputRange: BUD_REMAINING.map((left) => from.dy * left),
            }),
          },
          {
            scale: travel.interpolate({
              inputRange: BUD,
              outputRange: BUD_SCALE,
            }),
          },
        ],
      }
    : null;

  return (
    <Animated.View
      style={[orbStyles.orbAnchor, flightStyle]}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <DictationActionGlow style={orbStyles.orbGlow} />
      <View
        accessibilityRole="image"
        accessibilityLabel={orbAccessibilityLabel(face, job.title)}
        style={orbStyles.orb}
      >
        <LinearGradient
          colors={actionGradientColors}
          locations={[...ACTION_GRADIENT_LOCATIONS]}
          start={ACTION_GRADIENT_START}
          end={ACTION_GRADIENT_END}
          style={orbStyles.orbFill}
        />
        <OrbFace face={face} theme={theme} />
      </View>
      {/* Nothing to clear while it is still working, and the X is clutter until
          the pointer is actually on the orb. */}
      {face !== "running" && hovered ? (
        <Pressable
          testID="no-drag"
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${job.title}`}
          onPress={() => onDismiss(job)}
          style={[orbStyles.orbDismiss, webkitNoDrag]}
        >
          <IconClose width={9} height={9} color={meterColor} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
};

/** Sparks while it runs, then one mark for however it ended. */
const OrbFace: FC<{
  face: ReturnType<typeof actionOrbFace>;
  theme: Theme;
}> = ({ face, theme }) => (
  <View style={orbStyles.orbFace} pointerEvents="none">
    {face === "running" ? (
      <DictationPillFirefly
        theme={theme}
        vertical={false}
        isAction
        orbit={ORB_ORBIT}
      />
    ) : (
      <FinishedMark face={face} />
    )}
  </View>
);

const FinishedMark: FC<{ face: "done" | "error" }> = ({ face }) => {
  const Icon = face === "done" ? IconCheck : IconAlertCircle;
  return (
    <Icon width={ORB_ICON_SIZE} height={ORB_ICON_SIZE} color={meterColor} />
  );
};

function orbAccessibilityLabel(
  face: ReturnType<typeof actionOrbFace>,
  title: string,
): string {
  switch (face) {
    case "running":
      return `Action running: ${title}`;
    case "done":
      return `Action finished: ${title}`;
    case "error":
      return `Action failed: ${title}`;
    default: {
      const _exhaustive: never = face;
      return _exhaustive;
    }
  }
}

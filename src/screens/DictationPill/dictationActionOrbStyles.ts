import { createStyles } from "@/styles";
import { blurFilter } from "./dictationPillStyles";
import { GLOBAL, withAlpha } from "@/styles/color";
import { StyleSheet } from "react-native";
/** The orb matches the pill's thickness, so the two read as one family. */
export const ACTION_ORB_SIZE = 36;
export const ACTION_ORB_GAP = 8;
/** Clearance from the screen corner the orbs park in. */
export const ACTION_ORB_MARGIN = 10;
/**
 * How far the gradient glow bleeds past whatever it sits behind. Kept tight on
 * purpose: click-through is decided per-pixel by alpha, so every pixel the glow
 * paints is a pixel of window that stops passing clicks to the app underneath.
 */
const ORB_GLOW_SPREAD = 3;
/** The dismiss badge that sits on the orb's shoulder once a run ends. */
const ORB_DISMISS_SIZE = 16;

export const orbStyles = createStyles({
  /**
   * The overlay covers the work area so an orb can fly across it. It is almost
   * entirely empty: transparent here means click-through, so the desktop
   * underneath behaves exactly as it would without the window.
   */
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  /** The parked cluster. Absolute, so dragging it is just a new offset. */
  cluster: {
    position: "absolute",
    alignItems: "flex-end",
  },
  orbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ACTION_ORB_GAP,
  },
  orbAnchor: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  orb: {
    width: ACTION_ORB_SIZE,
    height: ACTION_ORB_SIZE,
    borderRadius: ACTION_ORB_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: withAlpha(GLOBAL.white, 0.18),
    boxShadow: `0 2px 7px ${withAlpha(GLOBAL.purple500, 0.18)}`,
  },
  orbFill: StyleSheet.absoluteFillObject,
  orbFace: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Kept out of the layout so a flying orb does not shuffle the parked ones. */
  orbFlight: {
    position: "relative",
  },
  /**
   * The brand gradient again, clipped to a circle and blurred out behind the
   * orb — a coloured halo that hugs the circle. Kept faint and tight: it is
   * the only lit thing in a transparent window, so any more spread reads as a
   * rectangular haze in the corner of the screen rather than a glow.
   */
  orbGlow: {
    position: "absolute",
    top: -ORB_GLOW_SPREAD,
    left: -ORB_GLOW_SPREAD,
    right: -ORB_GLOW_SPREAD,
    bottom: -ORB_GLOW_SPREAD,
    borderRadius: (ACTION_ORB_SIZE + ORB_GLOW_SPREAD * 2) / 2,
    overflow: "hidden",
    opacity: 0.3,
    ...blurFilter(`blur(${ORB_GLOW_SPREAD}px)`),
  },
  orbDismiss: {
    position: "absolute",
    top: -3,
    right: -3,
    width: ORB_DISMISS_SIZE,
    height: ORB_DISMISS_SIZE,
    borderRadius: ORB_DISMISS_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLOBAL.grey900,
    borderWidth: 1,
    borderColor: withAlpha(GLOBAL.white, 0.22),
  },
  glowFill: StyleSheet.absoluteFillObject,
});

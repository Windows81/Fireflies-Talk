import {
  DICTATION_PILL_BOTTOM_RAIL_INSET,
  DICTATION_PILL_TOOLTIP_GAP,
  DICTATION_PILL_TOOLTIP_MAX_WIDTH,
  DICTATION_PILL_BOTTOM_RAIL_INSET_WIN,
  DICTATION_PILL_SIDE_RAIL_INSET,
} from "electron/src/dictation/dictation-pill-layout";
import {
  DICTATION_PILL_TOAST_KEYCAP_PAD_Y,
  DICTATION_PILL_TOAST_LINE_HEIGHT,
  DICTATION_PILL_TOAST_MAX_WIDTH,
  DICTATION_PILL_TOAST_PADDING_Y,
} from "electron/src/dictation/dictation-pill-toast-layout";
import { PILL_BEZIER, PILL_THICKNESS } from "./dictationPillMode";
import { LIVE_BAR_WAVEFORM } from "@/screens/Live/components/PillWaveform";
import type { DictationPillSide } from "electron/src/types";
import { createStyles } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import { isWindowsDesktop } from "@/utils/device";
import { Easing, StyleSheet, type ViewStyle } from "react-native";

const DICTATION_PILL_BOTTOM_PADDING = isWindowsDesktop()
  ? DICTATION_PILL_BOTTOM_RAIL_INSET_WIN
  : DICTATION_PILL_BOTTOM_RAIL_INSET;

export const ACTION_BUTTON_SIZE = PILL_THICKNESS;
export const DIVIDER_LENGTH = 20;
const TOAST_PADDING_X = 10;
// The meter is the live bar's own waveform, so its box is derived from
// that geometry rather than guessed: a CSS rotation does not change an
// element's layout box, so a side dock needs the swapped size set explicitly or
// the bars overflow it and the gap to the logo reads wrong.
export const METER_WAVE_LENGTH =
  LIVE_BAR_WAVEFORM.barCount * LIVE_BAR_WAVEFORM.barWidth +
  (LIVE_BAR_WAVEFORM.barCount - 1) * LIVE_BAR_WAVEFORM.barGap;
export const METER_WAVE_THICKNESS = LIVE_BAR_WAVEFORM.maxHeight;
export const MARK_SIZE = 16;
export const METER_GAP = 8;
// Where the mark and the waveform sit along the meter row, measured from the
// row's own centre.
export const METER_MARK_OFFSET = -(METER_GAP + METER_WAVE_LENGTH) / 2;
export const METER_WAVE_OFFSET = (MARK_SIZE + METER_GAP) / 2;

/**
 * The shell is 73px long open, so anything centred in it by `50%` lands on a
 * half-pixel boundary. Chromium rounds a transformed element's layout position
 * to whole pixels, and on that boundary the tiniest layout noise — the shell's
 * animating size, a re-render — flips which pixel wins, so the mark would hop
 * a whole pixel as it slides. A quarter pixel off the boundary keeps the
 * rounding stable in either direction and moves nothing the eye can see.
 */
export const CENTRE_SNAP_BIAS = 0.25;

// Shared with the main process, which sizes the side host around it.
export const TOOLTIP_GAP = DICTATION_PILL_TOOLTIP_GAP;

export const PILL_EASING = Easing.bezier(...PILL_BEZIER);
export const LAYER_FADE_MS = 200;
export const LAYER_FADE_DELAY_MS = 100;
export const LAYER_MOVE_MS = 340;
/** Inactive layers sit back, smaller and defocused, so swaps read as depth. */
export const LAYER_REST_SCALE = 0.86;
export const LAYER_REST_BLUR_PX = 2;

/**
 * CSS `100deg` maps to a direction vector of (sin100°, -cos100°) in screen
 * space, projected onto the unit square expo-linear-gradient expects.
 */
export const ACTION_GRADIENT_START = { x: 0.01, y: 0.41 };
export const ACTION_GRADIENT_END = { x: 0.99, y: 0.59 };
export const ACTION_GRADIENT_LOCATIONS = [0, 0.46, 0.78, 1] as const;
export const ACTION_SKIN_FADE_MS = 240;

// Electron/React Native Web only. `-webkit-app-region` marks the draggable
// region of the frameless pill window. ViewStyle has no such key, hence the
// cast. These styles are inert on native.
export const webkitDrag = {
  WebkitAppRegion: "drag",
} as unknown as ViewStyle;

export const webkitNoDrag = {
  WebkitAppRegion: "no-drag",
  cursor: "pointer",
} as unknown as ViewStyle;

/** RN has no `filter` in ViewStyle; RN Web passes it through to CSS. */
export function blurFilter(value: unknown): ViewStyle {
  return { filter: value } as unknown as ViewStyle;
}

/** Likewise `background-image`, the only way to a radial glow on RN Web. */
export function radialGradient(stops: string): ViewStyle {
  return {
    backgroundImage: `radial-gradient(${stops})`,
  } as unknown as ViewStyle;
}

/**
 * A CSS backdrop blur only sees this window's own pixels. That softens the
 * macOS vibrancy layer under the capsules; a transparent Windows window has
 * nothing of its own underneath, so the filter is a compositing surface that
 * blurs nothing — and a stray rectangle whenever that surface shows.
 */
export const capsuleBackdrop = isWindowsDesktop()
  ? {}
  : { backdropFilter: "blur(22px) saturate(150%)" };

/**
 * Design 16b gave the shell its own flat gradient fill and bevel, real on
 * every platform rather than a glass edge that only read right over macOS
 * vibrancy. The rim itself is no longer platform-gated for the same reason:
 * it used to be dropped on Windows, where the shell was one flat solid color
 * and a plain white hairline read as a stray grey outline around it.
 */
const capsuleBorderAlpha = (alpha: number) => withAlpha(GLOBAL.white, alpha);

/**
 * The bevel behind the "flat, brighter rim" pass (design 16b): a hairline of
 * light along the top inner edge and of shadow along the bottom, so the flat
 * fill still reads as a rounded capsule rather than a cut-out silhouette.
 */
const SHELL_BEVEL = [
  `inset 0 1px 0 ${withAlpha(GLOBAL.white, 0.22)}`,
  `inset 0 -1px 0 ${withAlpha(GLOBAL.black, 0.55)}`,
  `inset 0 0 0 1px ${withAlpha(GLOBAL.white, 0.04)}`,
].join(", ");

export const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    overflow: "visible",
  },
  containerTop: {
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: DICTATION_PILL_BOTTOM_PADDING,
  },
  containerBottom: {
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: DICTATION_PILL_BOTTOM_PADDING,
  },
  containerLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: DICTATION_PILL_SIDE_RAIL_INSET,
  },
  containerRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: DICTATION_PILL_SIDE_RAIL_INSET,
  },
  shell: (theme) => ({
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    // The gradient fill (PillShellSurface) paints over this; kept as the
    // base so nothing shows through before that layer mounts.
    backgroundColor: theme.colors.dictationPillSurfaceSolid,
    borderWidth: 1.5,
    ...capsuleBackdrop,
    boxShadow: `0 10px 28px ${withAlpha(GLOBAL.grey900, 0.3)}`,
  }),
  /** Action mode trades the neutral drop shadow for a purple glow. */
  shellActionGlow: {
    boxShadow: `0 10px 30px ${withAlpha(GLOBAL.purple500, 0.34)}`,
  },
  // Its own layer above the fills: an inset shadow paints under an element's
  // children, so on the shell itself the surface gradient would cover it.
  shellBevel: {
    ...StyleSheet.absoluteFillObject,
    boxShadow: SHELL_BEVEL,
  },
  gradientFill: StyleSheet.absoluteFillObject,
  // The top sheen's box: inset from the sides, over the shell's upper half.
  // The shell's own `overflow: hidden` clips it to the capsule outline, so it
  // never needs to track the shell's own animated corner radius.
  shellGloss: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: 0,
    height: "45%",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  layerRow: {
    flexDirection: "row",
  },
  layerColumn: {
    flexDirection: "column",
  },
  actionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonHovered: {
    backgroundColor: withAlpha(GLOBAL.white, 0.12),
  },
  divider: {
    width: 1,
    height: DIVIDER_LENGTH,
    backgroundColor: withAlpha(GLOBAL.white, 0.14),
  },
  dividerVertical: {
    width: DIVIDER_LENGTH,
    height: 1,
  },
  /** Only the bars turn on a side dock — the firefly reads upright either way. */
  waveformSpin: {
    transform: [{ rotate: "90deg" }],
  },
  sliverBiasBottom: {
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  sliverBiasTop: {
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  sliverBiasLeft: {
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  sliverBiasRight: {
    alignItems: "flex-end",
    paddingRight: 4,
  },
  tooltipLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tooltipLayerBottom: {
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: DICTATION_PILL_BOTTOM_PADDING + PILL_THICKNESS + TOOLTIP_GAP,
  },
  tooltipLayerTop: {
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: DICTATION_PILL_BOTTOM_PADDING + PILL_THICKNESS + TOOLTIP_GAP,
  },
  tooltipLayerLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: DICTATION_PILL_SIDE_RAIL_INSET + PILL_THICKNESS + TOOLTIP_GAP,
  },
  tooltipLayerRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: DICTATION_PILL_SIDE_RAIL_INSET + PILL_THICKNESS + TOOLTIP_GAP,
  },
  // The mark beside the meter, matching the live bar's own resting content so
  // the two never read as different pills.
  meterLayer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: METER_GAP,
  },
  // A side dock runs the pill on its end, so the pair stacks instead. Only the
  // bars turn with it — the logo reads upright either way.
  meterLayerVertical: {
    flexDirection: "column",
  },
  /** Where the mark sits in the meter row; the mark itself rides a layer above. */
  markSlot: {
    width: MARK_SIZE,
    height: MARK_SIZE,
  },
  meter: {
    width: METER_WAVE_LENGTH,
    height: METER_WAVE_THICKNESS,
    alignItems: "center",
    justifyContent: "center",
  },
  meterVertical: {
    width: METER_WAVE_THICKNESS,
    height: METER_WAVE_LENGTH,
  },
  tooltip: (theme) => ({
    position: "absolute",
    // The host window reserves exactly this much; anything past it is clipped.
    maxWidth: DICTATION_PILL_TOOLTIP_MAX_WIDTH,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.dictationPillTooltipSurface,
    backdropFilter: "blur(10px)",
  }),
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  // The keys themselves sit on a cap so they read as something to press
  // rather than as part of the sentence around them.
  tooltipKeys: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: GLOBAL.white,
    backgroundColor: withAlpha(GLOBAL.white, 0.16),
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  tooltipLabel: {
    fontSize: 12,
    letterSpacing: -0.1,
    color: GLOBAL.white,
    whiteSpace: "nowrap",
  },
  tooltipLabelUrgent: (theme) => ({
    color: theme.colors.informationStaticRedText,
  }),
  /** Padded and anchored per dock from dictation-pill-toast-layout. */
  toastLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  toast: (theme) => ({
    maxWidth: DICTATION_PILL_TOAST_MAX_WIDTH,
    paddingVertical: DICTATION_PILL_TOAST_PADDING_Y,
    paddingLeft: TOAST_PADDING_X,
    // The cap is a filled block, so it needs a touch more room than the
    // label's glyphs to read as evenly inset from both ends.
    paddingRight: TOAST_PADDING_X + 2,
    borderRadius: 8,
    backgroundColor: theme.colors.dictationPillTooltipSurface,
    backdropFilter: "blur(10px)",
    boxShadow: `0 6px 18px ${withAlpha(GLOBAL.grey900, 0.3)}`,
  }),
  toastLabel: {
    fontSize: 12,
    lineHeight: DICTATION_PILL_TOAST_LINE_HEIGHT,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: GLOBAL.white,
    whiteSpace: "nowrap",
  },
  toastKeys: {
    fontSize: 12,
    lineHeight:
      DICTATION_PILL_TOAST_LINE_HEIGHT - DICTATION_PILL_TOAST_KEYCAP_PAD_Y * 2,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: GLOBAL.white,
    backgroundColor: withAlpha(GLOBAL.white, 0.16),
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: DICTATION_PILL_TOAST_KEYCAP_PAD_Y,
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
});

/**
 * A point on the docked edge, dead centre along it. Nothing here ever animates,
 * so it never rounds to a different pixel from one frame to the next; what
 * hangs off it carries the shell's changing thickness in its own transform.
 */
export function dockedEdgeAnchor(side: DictationPillSide): ViewStyle {
  switch (side) {
    case "left":
      return { top: "50%", left: DICTATION_PILL_SIDE_RAIL_INSET };
    case "right":
      return { top: "50%", right: DICTATION_PILL_SIDE_RAIL_INSET };
    case "bottom":
      return { left: "50%", bottom: DICTATION_PILL_BOTTOM_PADDING };
    case "top":
      return { left: "50%", top: DICTATION_PILL_BOTTOM_PADDING };
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

/**
 * The resting bar sits slightly off-centre, biased toward the docked screen
 * edge, so it reads as a grabber rather than a floating dot.
 */
export function sliverEdgeBias(side: DictationPillSide) {
  switch (side) {
    case "left":
      return styles.sliverBiasLeft;
    case "right":
      return styles.sliverBiasRight;
    case "bottom":
      return styles.sliverBiasBottom;
    case "top":
      return styles.sliverBiasTop;
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

// Design 16b brightens the rim at rest; action mode keeps its own step above it.
export const SHELL_BORDER_REST = capsuleBorderAlpha(0.24);
export const SHELL_BORDER_ACTION = capsuleBorderAlpha(0.34);

export const actionGradientColors = [
  GLOBAL.purple600,
  GLOBAL.purple500,
  GLOBAL.mauve500,
  GLOBAL.magenta500,
] as const;

/** The meter sits on the dark shell and on the action gradient — always white. */
export const meterColor = withAlpha(GLOBAL.white, 0.95);

export const iconRestColor = withAlpha(GLOBAL.white, 0.82);
export const iconHoverColor = GLOBAL.white;
export const sliverBarColors = [
  GLOBAL.purple400,
  GLOBAL.purple500,
  GLOBAL.purple700,
] as const;

import type { DictationPillSide } from "../types";
import {
  DICTATION_PILL_THICKNESS,
  edgeAnchorOffset,
  type PillRect,
} from "./dictation-pill-layout";

/**
 * Geometry for docking the live bar to a screen edge. The bar is its own
 * surface, independent of the dictation pill: it opens on the top edge and
 * keeps whatever edge and place along it the user drags it to.
 */

/** Live compact bar. Matches the dictation pill's thickness. */
export const LIVE_BAR_HEIGHT = DICTATION_PILL_THICKNESS;
export const LIVE_BAR_TOP_PADDING = 8;

/** Gap held between a docked live bar and the screen edge it sits on. */
export const LIVE_BAR_DOCK_MARGIN = 8;

/**
 * Side dock turns the bar into a vertical rail: circle + gap + tab rail + gap
 * + stop capsule, padded. The rail is pinned to the top of its window, so its
 * height — not the window's — is what has to be centred on the pill.
 */
export const VERTICAL_RAIL_WIDTH = LIVE_BAR_HEIGHT + 24;

/**
 * The mark heads the tab rail, taking exactly one tab's slot so the icons keep
 * an even rhythm down the rail and the mark clears the capsule's corner curve
 * instead of crowding into it. Its box has to be counted in the rail's height
 * or the window clips the stop control and the rail's centre drifts off the
 * pill it was anchored to.
 */
export const LIVE_BAR_LOGO_SIZE = 16;
/** One tab is LIVE_BAR_HEIGHT less the rail's 1px border on each side. */
const RAIL_TAB_HEIGHT = LIVE_BAR_HEIGHT - 2;
export const LIVE_BAR_LOGO_GAP = (RAIL_TAB_HEIGHT - LIVE_BAR_LOGO_SIZE) / 2;
const LIVE_BAR_LOGO_BLOCK = RAIL_TAB_HEIGHT;

export const VERTICAL_RAIL_HEIGHT =
  LIVE_BAR_TOP_PADDING +
  LIVE_BAR_HEIGHT +
  8 +
  (LIVE_BAR_LOGO_BLOCK + LIVE_BAR_HEIGHT * 3 + 24) +
  8 +
  LIVE_BAR_HEIGHT * 2 +
  8;

/**
 * Screen origin of the visible rail inside a live-bar window. Panels make the
 * window taller or wider than the rail, and closing them changes those bounds
 * without moving the rail. Drag offsets have to be against this origin or the
 * follow loop parks the shrunk window at the old top-left.
 */
export type LiveBarPoint = {
  x: number;
  y: number;
};

export function liveBarRailOrigin(
  side: DictationPillSide,
  bounds: PillRect,
  railThickness: number = LIVE_BAR_HEIGHT,
): LiveBarPoint {
  switch (side) {
    case "bottom":
      return { x: bounds.x, y: bounds.y + bounds.height - railThickness };
    case "top":
    case "left":
      return { x: bounds.x, y: bounds.y };
    case "right":
      return { x: bounds.x + bounds.width - railThickness, y: bounds.y };
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** The dictation pill as something else on screen has to keep clear of. */
export type VisibleDictationPill = {
  side: DictationPillSide;
  bounds: PillRect;
};

function intersects(a: PillRect, b: PillRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Edge a fresh bar opens on. The bar lives top-centre unless the dictation
 * pill is already docked to the top of the same display, in which case it
 * takes the bottom so the two surfaces never open on top of each other. A
 * pill on another monitor has nothing to collide with here and leaves the top
 * free.
 */
export function liveBarOpeningSide(
  pill: VisibleDictationPill | null,
  workArea: PillRect,
): DictationPillSide {
  if (!pill || pill.side !== "top") return "top";
  return intersects(pill.bounds, workArea) ? "bottom" : "top";
}

/** Bottom dock is the only edge with nothing below it to open into. */
export function liveBarGrowsUpward(side: DictationPillSide): boolean {
  return side === "bottom";
}

/**
 * Screen rect of the visible rail inside a live-bar window. The window is
 * sized for its panels and can be several times the rail's height, so its
 * centre may sit far from the bar the user is actually holding; which edge a
 * drop docks to has to be judged from the rail. A top or bottom bar is centred
 * across the window; a side rail is pinned to the window's top.
 */
export function liveBarRailRect(
  side: DictationPillSide,
  bounds: PillRect,
): PillRect {
  const origin = liveBarRailOrigin(side, bounds);
  if (side === "left" || side === "right") {
    return {
      x: origin.x,
      y: origin.y,
      width: LIVE_BAR_HEIGHT,
      height: Math.min(VERTICAL_RAIL_HEIGHT, bounds.height),
    };
  }
  return {
    x: bounds.x,
    y: origin.y,
    width: bounds.width,
    height: LIVE_BAR_HEIGHT,
  };
}

/**
 * Where a dragged bar lands. It pins to the edge it was dropped nearest but
 * keeps the place along that edge the user chose — dropping near a corner has
 * to leave it near that corner. Snapping to the edge's midpoint is what makes
 * a corner drop look like the bar flew to the middle of the screen.
 *
 * The place is measured from the rail the user was holding (`from` is the
 * dock it was dragged off), not from the window: a bottom bar sits at the foot
 * of its window, so going by the window's top-left would land a side rail a
 * whole window-height above where the bar was let go.
 */
export function liveBarDropBounds(
  side: DictationPillSide,
  from: DictationPillSide,
  bounds: PillRect,
  workArea: PillRect,
): PillRect {
  const { width, height } = bounds;
  const rail = liveBarRailRect(from, bounds);
  const railCx = rail.x + rail.width / 2;
  const railCy = rail.y + rail.height / 2;
  const alongX = Math.round(
    clamp(railCx - width / 2, workArea.x, workArea.x + workArea.width - width),
  );
  const railTop = clamp(
    from === "left" || from === "right"
      ? rail.y
      : railCy - VERTICAL_RAIL_HEIGHT / 2,
    workArea.y,
    workArea.y + workArea.height - VERTICAL_RAIL_HEIGHT,
  );
  const alongY = Math.round(
    clamp(railTop, workArea.y, workArea.y + workArea.height - height),
  );
  const m = LIVE_BAR_DOCK_MARGIN;
  switch (side) {
    case "bottom":
      return {
        x: alongX,
        y: workArea.y + workArea.height - height - m,
        width,
        height,
      };
    case "top":
      return { x: alongX, y: workArea.y + m, width, height };
    case "left":
      return { x: workArea.x + m, y: alongY, width, height };
    case "right":
      return {
        x: workArea.x + workArea.width - width - m,
        y: alongY,
        width,
        height,
      };
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

/**
 * Y for a side-docked bar whose rail should sit at `anchor` along the edge.
 *
 * The rail is pinned to the top of a window several times its height, so the
 * anchor has to be resolved against the rail's own span. Resolving it against
 * the window's height leaves the rail high up the screen — the window is
 * placed correctly and the only visible part of it is not.
 */
export function liveBarSideAnchoredY(
  anchor: number,
  workArea: PillRect,
  windowHeight: number,
): number {
  const railTop =
    workArea.y +
    edgeAnchorOffset(workArea.height - VERTICAL_RAIL_HEIGHT, anchor);
  return Math.round(
    clamp(railTop, workArea.y, workArea.y + workArea.height - windowHeight),
  );
}

/** The inverse: where along the edge a side-docked bar's rail currently sits. */
export function liveBarSideAnchorFraction(
  bounds: PillRect,
  workArea: PillRect,
): number {
  const span = workArea.height - VERTICAL_RAIL_HEIGHT;
  if (span <= 0) return 0.5;
  return clamp((bounds.y - workArea.y) / span, 0, 1);
}

/**
 * Where the bar opened before the Universal Pill: flush with the top of the
 * work area and centred, with no dock to remember. Users without the dictation
 * flag still get this bar.
 */
export function legacyLiveBarBounds(
  size: { width: number; height: number },
  workArea: PillRect,
): PillRect {
  return {
    x: workArea.x + (workArea.width - size.width) / 2,
    y: workArea.y,
    width: size.width,
    height: size.height,
  };
}

/** The legacy bar's floor: two side-by-side panels wide, a card tall. */
export const LEGACY_LIVE_BAR_MIN_WIDTH = 1020;
export const LEGACY_LIVE_BAR_MIN_HEIGHT = 300;
/** The Universal Pill's floor: small enough for the docked rail. */
export const LIVE_BAR_COMPACT_MIN = LIVE_BAR_HEIGHT + 24;

/**
 * Minimum size of the compact live window. The Universal Pill shrinks the
 * window to its content, so its floor is the rail; the legacy bar's floor was
 * the two-panel layout and silently overrode every narrower resize.
 */
export function liveCompactWindowMinSize(
  universalPill: boolean,
  compact: { width: number; height: number },
) {
  if (universalPill) {
    return { minWidth: LIVE_BAR_COMPACT_MIN, minHeight: LIVE_BAR_COMPACT_MIN };
  }

  return {
    minWidth: Math.min(LEGACY_LIVE_BAR_MIN_WIDTH, compact.width),
    minHeight: LEGACY_LIVE_BAR_MIN_HEIGHT,
  };
}

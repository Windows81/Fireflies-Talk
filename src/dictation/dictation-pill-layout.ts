import type { DictationPillSide } from "../types";

export type PillRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DICTATION_PILL_HORIZONTAL_WIDTH = 360;
export const DICTATION_PILL_HORIZONTAL_HEIGHT = 100;
export const DICTATION_PILL_SIDE_HEIGHT = 200;
export const DICTATION_PILL_EDGE_MARGIN = 8;
// Shared thickness of every floating capsule (pill, live bar, side capsules).
export const DICTATION_PILL_THICKNESS = 36;
// Matches paddingLeft/Right on the side pill container. The host hangs this
// far past the work-area edge so the visible rail sits EDGE_MARGIN from the
// screen without sitting on the window's corner mask.
export const DICTATION_PILL_SIDE_RAIL_INSET = 12;
/** Space between the rail and the tooltip it opens inward. */
export const DICTATION_PILL_TOOLTIP_GAP = 8;
/**
 * Room the host window keeps for that tooltip. It has to fit the longest one
 * the pill shows — "Press [Ctrl+Alt+N] to take notes" on Windows — because the
 * window clips anything past its own edge and the tooltip is a single line.
 */
export const DICTATION_PILL_TOOLTIP_MAX_WIDTH = 220;
export const DICTATION_PILL_SIDE_RAIL_THICKNESS = 36;
export const DICTATION_PILL_BOTTOM_RAIL_INSET = 8;
export const DICTATION_PILL_BOTTOM_RAIL_INSET_WIN = 6;
// The resting nub. Room for its four embers with a little air around them.
export const DICTATION_PILL_BOTTOM_RAIL_THICKNESS = 13;
export const DICTATION_PILL_GRABBER_LENGTH = 44;
/** Two square action halves and the 1px divider — the launcher's box. */
export const DICTATION_PILL_OPEN_LENGTH = DICTATION_PILL_THICKNESS * 2 + 1;
// Resting un-minimized: a mark and nothing else, so it sits a little inside the
// launcher it opens into. Shared, because the main process hit-tests this box.
export const DICTATION_PILL_RESTING_LENGTH = 62;
export const DICTATION_PILL_RESTING_THICKNESS = 32;
/** Quick to attend, slow to leave: the pill wakes fast and settles unhurried. */
export const DICTATION_PILL_WAKE_MORPH_MS = 420;
export const DICTATION_PILL_REST_MORPH_MS = 1100;
// The launcher opens only with the cursor on the pill itself, not near it: the
// nub is big enough to catch, and the embers already stir as the cursor nears.
// Exported so tests can assert the hover boxes against the shape they wrap.
export const DICTATION_PILL_HOVER_PAD = 0;
const HOVER_EXPAND_PAD = DICTATION_PILL_HOVER_PAD;
// Side docks are a slim vertical rail. Hover adds an inward shortcut tooltip,
// so the host spans the rail plus the room that tooltip needs — the window
// clips it otherwise, and the host is larger than the rail anyway so the
// window's corner mask cannot cut into it.
export const DICTATION_PILL_SIDE_WIDTH =
  DICTATION_PILL_SIDE_RAIL_INSET +
  DICTATION_PILL_THICKNESS +
  DICTATION_PILL_TOOLTIP_GAP +
  DICTATION_PILL_TOOLTIP_MAX_WIDTH;

// 8px lower than the original 12.
export const DICTATION_PILL_BOTTOM_MARGIN_WIN = 4;
export const DICTATION_PILL_BOTTOM_MARGIN_MAC = 4;
export const DICTATION_SNAP_FALLOFF_PX = 220;
export const DICTATION_DRAG_MOVE_THRESHOLD_PX = 4;

export function shouldUseStillnessAsDragEnd(
  platform: NodeJS.Platform,
  canReadMouseButton: boolean,
): boolean {
  if (platform === "win32") return false;
  return !canReadMouseButton;
}

export function hasDictationDragMoved(
  origin: { x: number; y: number },
  current: { x: number; y: number },
  thresholdPx = DICTATION_DRAG_MOVE_THRESHOLD_PX,
): boolean {
  return (
    Math.abs(current.x - origin.x) >= thresholdPx ||
    Math.abs(current.y - origin.y) >= thresholdPx
  );
}

export function shouldHoldDictationReposition(opts: {
  dragging: boolean;
  snapping: boolean;
  captionLoopActive: boolean;
}): boolean {
  return opts.dragging || opts.snapping || opts.captionLoopActive;
}

export function isDictationPillSideDock(side: DictationPillSide): boolean {
  return side === "left" || side === "right";
}

/** Visible rail/grabber inside the oversized host window. */
/**
 * Where the open launcher sits inside the host window: a box, on the same
 * docked edge as the nub and centred along it. The cursor over it must reach
 * the buttons at once — the per-pixel click-through sampling is too slow for a
 * hand that moves onto a button and clicks — so this is what the main process
 * hit-tests while the launcher is open.
 */
export function getDictationLauncherBounds(
  side: DictationPillSide,
  platform: NodeJS.Platform = process.platform,
): PillRect {
  const inset = dictationPillBottomRailInset(platform);
  switch (side) {
    case "left":
      return {
        x: DICTATION_PILL_SIDE_RAIL_INSET,
        y: (DICTATION_PILL_SIDE_HEIGHT - DICTATION_PILL_OPEN_LENGTH) / 2,
        width: DICTATION_PILL_THICKNESS,
        height: DICTATION_PILL_OPEN_LENGTH,
      };
    case "right":
      return {
        x:
          DICTATION_PILL_SIDE_WIDTH -
          DICTATION_PILL_SIDE_RAIL_INSET -
          DICTATION_PILL_THICKNESS,
        y: (DICTATION_PILL_SIDE_HEIGHT - DICTATION_PILL_OPEN_LENGTH) / 2,
        width: DICTATION_PILL_THICKNESS,
        height: DICTATION_PILL_OPEN_LENGTH,
      };
    case "top":
      return {
        x: (DICTATION_PILL_HORIZONTAL_WIDTH - DICTATION_PILL_OPEN_LENGTH) / 2,
        y: inset,
        width: DICTATION_PILL_OPEN_LENGTH,
        height: DICTATION_PILL_THICKNESS,
      };
    case "bottom":
      return {
        x: (DICTATION_PILL_HORIZONTAL_WIDTH - DICTATION_PILL_OPEN_LENGTH) / 2,
        y: DICTATION_PILL_HORIZONTAL_HEIGHT - inset - DICTATION_PILL_THICKNESS,
        width: DICTATION_PILL_OPEN_LENGTH,
        height: DICTATION_PILL_THICKNESS,
      };
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

/** Whether a window-relative point falls on a rect. */
export function isPointInRect(
  point: { x: number; y: number },
  rect: PillRect,
): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

export function getDictationPillVisualBounds(
  pill: PillRect,
  side: DictationPillSide,
  platform: NodeJS.Platform = process.platform,
): PillRect {
  switch (side) {
    case "left":
      return {
        x: pill.x + DICTATION_PILL_SIDE_RAIL_INSET,
        y: pill.y,
        width: DICTATION_PILL_SIDE_RAIL_THICKNESS,
        height: pill.height,
      };
    case "right":
      return {
        x:
          pill.x +
          pill.width -
          DICTATION_PILL_SIDE_RAIL_INSET -
          DICTATION_PILL_SIDE_RAIL_THICKNESS,
        y: pill.y,
        width: DICTATION_PILL_SIDE_RAIL_THICKNESS,
        height: pill.height,
      };
    case "top":
      return {
        x: pill.x,
        y: pill.y + dictationPillBottomRailInset(platform),
        width: pill.width,
        height: DICTATION_PILL_BOTTOM_RAIL_THICKNESS,
      };
    case "bottom":
      return {
        x: pill.x,
        y:
          pill.y +
          pill.height -
          dictationPillBottomRailInset(platform) -
          DICTATION_PILL_BOTTOM_RAIL_THICKNESS,
        width: pill.width,
        height: DICTATION_PILL_BOTTOM_RAIL_THICKNESS,
      };
  }
}

/**
 * The box pill-anchored cards sit next to. The un-minimized pill is thicker
 * than the nub's rail on the top and bottom edges, so anchoring to the rail
 * would park the card under the resting pill.
 */
export function getDictationPillAnchorBounds(
  pill: PillRect,
  side: DictationPillSide,
  minimized: boolean,
  platform: NodeJS.Platform = process.platform,
): PillRect {
  const visual = getDictationPillVisualBounds(pill, side, platform);
  if (minimized || isDictationPillSideDock(side)) return visual;
  const inset = dictationPillBottomRailInset(platform);
  if (side === "top") {
    return {
      x: pill.x,
      y: pill.y + inset,
      width: pill.width,
      height: DICTATION_PILL_RESTING_THICKNESS,
    };
  }
  return {
    x: pill.x,
    y: pill.y + pill.height - inset - DICTATION_PILL_RESTING_THICKNESS,
    width: pill.width,
    height: DICTATION_PILL_RESTING_THICKNESS,
  };
}

export function dictationPillBottomMargin(platform: NodeJS.Platform): number {
  return platform === "win32"
    ? DICTATION_PILL_BOTTOM_MARGIN_WIN
    : DICTATION_PILL_BOTTOM_MARGIN_MAC;
}

export function dictationPillBottomRailInset(
  platform: NodeJS.Platform,
): number {
  return platform === "win32"
    ? DICTATION_PILL_BOTTOM_RAIL_INSET_WIN
    : DICTATION_PILL_BOTTOM_RAIL_INSET;
}

export function getDictationPillWindowSize(side: DictationPillSide): {
  width: number;
  height: number;
} {
  if (isDictationPillSideDock(side)) {
    return {
      width: DICTATION_PILL_SIDE_WIDTH,
      height: DICTATION_PILL_SIDE_HEIGHT,
    };
  }
  return {
    width: DICTATION_PILL_HORIZONTAL_WIDTH,
    height: DICTATION_PILL_HORIZONTAL_HEIGHT,
  };
}

/**
 * Where along its docked edge a surface sits, as a fraction of the span it can
 * travel. A fraction rather than a pixel offset so the spot survives a move to
 * a display of another size, or a work area that changes under it.
 */
export function edgeAnchorFraction(
  side: DictationPillSide,
  bounds: PillRect,
  workArea: PillRect,
): number {
  const horizontal = side === "bottom" || side === "top";
  const span = horizontal
    ? workArea.width - bounds.width
    : workArea.height - bounds.height;
  if (span <= 0) return 0.5;
  const offset = horizontal ? bounds.x - workArea.x : bounds.y - workArea.y;
  return Math.min(1, Math.max(0, offset / span));
}

/**
 * The along-edge anchor that centres a host of `hostSize` on `centre`.
 *
 * A drag can cross between hosts of different shapes — the side host is wider
 * and shorter than the horizontal one — so the spot has to be carried as a
 * position on screen rather than as a fraction of whichever host it happened
 * to leave. Both hosts centre their visible surface on the along-edge axis, so
 * centring the host puts the pill back under where the user let go, clamping
 * when that edge cannot reach.
 */
export function edgeAnchorForCentre(
  side: DictationPillSide,
  centre: number,
  workArea: PillRect,
  hostSize: { width: number; height: number },
): number {
  const horizontal = side === "bottom" || side === "top";
  const extent = horizontal ? hostSize.width : hostSize.height;
  const span = (horizontal ? workArea.width : workArea.height) - extent;
  if (span <= 0) return 0.5;
  const origin = horizontal ? workArea.x : workArea.y;
  const fraction = (centre - extent / 2 - origin) / span;
  return Math.min(1, Math.max(0, fraction));
}

/** The pixel offset a fraction resolves to for a surface of a given span. */
export function edgeAnchorOffset(span: number, anchor: number): number {
  return Math.round(Math.max(0, span) * Math.min(1, Math.max(0, anchor)));
}

export function getDictationPillBounds(
  side: DictationPillSide,
  workArea: PillRect,
  bottomMargin: number,
  /** 0.5 keeps the historical centred dock. */
  edgeAnchor = 0.5,
): PillRect {
  const { width, height } = getDictationPillWindowSize(side);
  const edge = DICTATION_PILL_EDGE_MARGIN;
  const alongX =
    workArea.x + edgeAnchorOffset(workArea.width - width, edgeAnchor);
  const alongY =
    workArea.y + edgeAnchorOffset(workArea.height - height, edgeAnchor);

  switch (side) {
    case "top":
      return { x: alongX, y: workArea.y + bottomMargin, width, height };
    case "bottom":
      return {
        x: alongX,
        y: workArea.y + workArea.height - height - bottomMargin,
        width,
        height,
      };
    case "left":
      return {
        x: workArea.x + edge - DICTATION_PILL_SIDE_RAIL_INSET,
        y: alongY,
        width,
        height,
      };
    case "right":
      return {
        x:
          workArea.x +
          workArea.width -
          width -
          edge +
          DICTATION_PILL_SIDE_RAIL_INSET,
        y: alongY,
        width,
        height,
      };
  }
}

export type DictationHoverRegion = {
  centerX: number;
  centerY: number;
  expandHalfW: number;
  expandHalfH: number;
  collapseHalfW: number;
  collapseHalfH: number;
};

export function getDictationHoverRegion(
  side: DictationPillSide,
  platform: NodeJS.Platform = process.platform,
  /** False rests the pill at full size, so it has a bigger target to hit. */
  minimized = true,
): DictationHoverRegion {
  // Resting un-minimized the pill is the launcher's box, not the nub's, and it
  // stands further off the edge. Hit-testing the nub's strip would leave most
  // of the visible pill dead to the cursor.
  const thickness = minimized
    ? DICTATION_PILL_BOTTOM_RAIL_THICKNESS
    : DICTATION_PILL_RESTING_THICKNESS;
  const length = minimized
    ? DICTATION_PILL_GRABBER_LENGTH
    : DICTATION_PILL_RESTING_LENGTH;
  const halfThickness = thickness / 2;
  const grabberHalfW = halfThickness + HOVER_EXPAND_PAD;
  const grabberHalfL = length / 2 + HOVER_EXPAND_PAD;

  switch (side) {
    case "left":
      return {
        centerX: DICTATION_PILL_SIDE_RAIL_INSET + halfThickness,
        centerY: DICTATION_PILL_SIDE_HEIGHT / 2,
        expandHalfW: grabberHalfW,
        expandHalfH: grabberHalfL,
        collapseHalfW: 160,
        collapseHalfH: 48,
      };
    case "right":
      return {
        centerX:
          DICTATION_PILL_SIDE_WIDTH -
          DICTATION_PILL_SIDE_RAIL_INSET -
          halfThickness,
        centerY: DICTATION_PILL_SIDE_HEIGHT / 2,
        expandHalfW: grabberHalfW,
        expandHalfH: grabberHalfL,
        collapseHalfW: 160,
        collapseHalfH: 48,
      };
    case "top":
      return {
        centerX: DICTATION_PILL_HORIZONTAL_WIDTH / 2,
        centerY: dictationPillBottomRailInset(platform) + halfThickness,
        expandHalfW: grabberHalfL,
        expandHalfH: grabberHalfW,
        collapseHalfW: 110,
        collapseHalfH: 46,
      };
    case "bottom":
      return {
        centerX: DICTATION_PILL_HORIZONTAL_WIDTH / 2,
        centerY:
          DICTATION_PILL_HORIZONTAL_HEIGHT -
          dictationPillBottomRailInset(platform) -
          halfThickness,
        expandHalfW: grabberHalfL,
        expandHalfH: grabberHalfW,
        collapseHalfW: 110,
        collapseHalfH: 46,
      };
  }
}

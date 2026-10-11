import { getDictationHoverRegion } from "electron/src/dictation/dictation-pill-layout";
import type { DictationPillSide } from "electron/src/types";
import type { DictationPillMode } from "./dictationPillMode";

/**
 * The four fireflies the pill carries. Pure geometry — where each one sits in
 * every shape and how the cursor stirs them — kept free of React Native so the
 * rules stay unit-testable.
 */

export type EmberTone = "pink" | "purple";

export type EmberSpec = {
  size: number;
  tone: EmberTone;
  /** Glow radius at full burn. */
  glow: number;
  /** How far, in px, a cursor beside the nub tips it, and a near one lifts it. */
  lean: number;
  lift: number;
};

export const EMBERS: readonly EmberSpec[] = [
  { size: 3, tone: "pink", glow: 7, lean: 2, lift: 1 },
  { size: 2.5, tone: "pink", glow: 5, lean: 1.4, lift: 0.75 },
  { size: 3, tone: "purple", glow: 5, lean: 1.8, lift: 1 },
  { size: 2.5, tone: "pink", glow: 6, lean: 1.2, lift: 0.75 },
];

/** Each ember sets off a beat after the one before, so a move reads as a flock. */
export const EMBER_STAGGER_MS = 50;
export const EMBER_FADE_MS = 400;
/** An ember lights where it stands before it flies, so it reads as coming alive. */
export const EMBER_IGNITE_MS = 120;
/** Going out, an ember first lands in its cell of the mark, then dims. */
export const EMBER_LAND_MS = 250;
/**
 * The launcher opening douses the embers where they sit, at once and quickly:
 * they are gone before its buttons fade in, so the two never overlap.
 */
export const EMBER_DOUSE_MS = 150;
/** The cursor fully stirs the embers this close to the nub's centre… */
export const EMBER_NEAR_HOLD = 12;
/** …and its pull fades to nothing this much further out. */
export const EMBER_NEAR_FALLOFF = 75;
/** Cursor travel along the edge that fully tips the embers toward it. */
export const EMBER_LEAN_RANGE = 30;

// At rest the four sit in a row along the nub. Opened, they stay exactly
// there and go out — nothing moves into the launcher's middle, whose divider
// is the only thing between Dictate and Notes — so closing relights them in
// place with no dot ever crossing the seam.
const ROW_ALONG = [-12, -4, 4, 12];
// Wherever the mark shows, each ember hides in one of its four cells: that is
// where they come from when the mark breaks into the launcher and where they
// dive when a session lights it.
const CELL = 4;
const CELLS = [
  { along: -CELL, across: -CELL },
  { along: -CELL, across: CELL },
  { along: CELL, across: CELL },
  { along: CELL, across: -CELL },
];
// Once dark inside a running session they wait scattered along the meter's own
// spark orbit instead — so when the session lands they surface among the
// sparks and drift home from there, each on its own diagonal.
const ORBIT = [
  { along: -7.5, across: -3.5 },
  { along: -2.5, across: 2 },
  { along: 3, across: -6 },
  { along: 8.5, across: -0.5 },
];

/** Where an ember sits, in the pill's own axes, relative to the shell centre. */
export type EmberPlace = {
  along: number;
  across: number;
  /** False and the ember fades out on the way there. */
  lit: boolean;
};

/** `meterMarkOffset` is the mark's centre along the pill when it wears the meter. */
export function placeEmber(
  mode: DictationPillMode,
  index: number,
  meterMarkOffset: number,
): EmberPlace {
  switch (mode) {
    case "hidden":
      return { along: ROW_ALONG[index], across: 0, lit: true };
    case "open":
      return { along: ROW_ALONG[index], across: 0, lit: false };
    // The un-minimized pill rests as the mark, centred.
    case "resting":
      return { ...CELLS[index], lit: false };
    case "dictating": {
      const cell = CELLS[index];
      return {
        along: meterMarkOffset + cell.along,
        across: cell.across,
        lit: false,
      };
    }
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/**
 * Where a dark ember waits out a session: its spot along the meter's spark
 * orbit. `meterWaveOffset` is the waveform's centre along the pill.
 */
export function placeEmberOrbit(
  index: number,
  meterWaveOffset: number,
): EmberPlace {
  const spot = ORBIT[index];
  return {
    along: meterWaveOffset + spot.along,
    across: spot.across,
    lit: false,
  };
}

/** Side docks run the pill on its end, so along and across swap axes there. */
export function emberOffset(
  place: EmberPlace,
  vertical: boolean,
): { x: number; y: number } {
  return vertical
    ? { x: place.across, y: place.along }
    : { x: place.along, y: place.across };
}

/** Unit step from the docked edge into the screen — the way a stirred ember lifts. */
export function emberLift(side: DictationPillSide): { x: number; y: number } {
  switch (side) {
    case "left":
      return { x: 1, y: 0 };
    case "right":
      return { x: -1, y: 0 };
    case "top":
      return { x: 0, y: 1 };
    case "bottom":
      return { x: 0, y: -1 };
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

/**
 * From the docked edge to the centre line of a shell this thick. The embers
 * hang off that fixed edge rather than the shell's own centre, which moves in
 * whole-pixel layout steps as the shell changes size, and carry this depth in
 * their transform so they glide through the fractions the shell cannot.
 *
 * Snapped to the pixel grid: the 13px nub's centre line falls between two
 * rows, and a 3px dot resting there would smear across four of them.
 */
export function emberDepth(
  side: DictationPillSide,
  thickness: number,
): { x: number; y: number } {
  const lift = emberLift(side);
  const depth = Math.round(thickness / 2);
  return { x: lift.x * depth, y: lift.y * depth };
}

/** The resting nub's centre in host-window coordinates. */
export function emberNubCentre(
  side: DictationPillSide,
  platform: NodeJS.Platform,
): { x: number; y: number } {
  const region = getDictationHoverRegion(side, platform, true);
  return { x: region.centerX, y: region.centerY };
}

export type EmberStir = {
  /** 1 with the cursor on the nub, fading to 0 as it moves off. */
  near: number;
  /** -1..1: which way along the edge the cursor sits. */
  lean: number;
};

export function resolveEmberStir(
  cursor: { x: number; y: number },
  centre: { x: number; y: number },
  vertical: boolean,
): EmberStir {
  const dx = cursor.x - centre.x;
  const dy = cursor.y - centre.y;
  const distance = Math.hypot(dx, dy);
  const near = clamp(1 - (distance - EMBER_NEAR_HOLD) / EMBER_NEAR_FALLOFF);
  const along = vertical ? dy : dx;
  const lean = clamp(along / EMBER_LEAN_RANGE, -1);
  return { near, lean };
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

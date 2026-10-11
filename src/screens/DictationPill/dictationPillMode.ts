import {
  DICTATION_PILL_BOTTOM_RAIL_THICKNESS,
  DICTATION_PILL_GRABBER_LENGTH,
  DICTATION_PILL_OPEN_LENGTH,
  DICTATION_PILL_RESTING_LENGTH,
  DICTATION_PILL_RESTING_THICKNESS,
  DICTATION_PILL_REST_MORPH_MS as REST_MORPH_MS,
  DICTATION_PILL_THICKNESS,
  DICTATION_PILL_WAKE_MORPH_MS as WAKE_MORPH_MS,
} from "electron/src/dictation/dictation-pill-layout";
import type { DictationPillSide, DictationState } from "electron/src/types";

/**
 * Pure pill geometry and state, kept free of React Native imports so the rules
 * below stay unit-testable.
 */

/** Resting sliver. Shared with the main process so hit-testing cannot drift. */
export const HIDDEN_LENGTH = DICTATION_PILL_GRABBER_LENGTH;
export const HIDDEN_THICKNESS = DICTATION_PILL_BOTTOM_RAIL_THICKNESS;
export const PILL_THICKNESS = DICTATION_PILL_THICKNESS;
// Two square action halves and the 1px divider between them. Shared with the
// main process, which hit-tests this box when the pill rests un-minimized.
export const OPEN_LENGTH = DICTATION_PILL_OPEN_LENGTH;
// Dictation's meter shares the launcher's box, so the shell never moves as
// the pill passes between the launcher and a session.
export const METER_THICKNESS = PILL_THICKNESS;
export const METER_LENGTH = OPEN_LENGTH;
export const DICTATING_THICKNESS = METER_THICKNESS;
export const DICTATING_LENGTH = METER_LENGTH;
// Resting un-minimized carries only the mark, so it sits a little inside the
// launcher it grows into. Shared with the main process, which hit-tests it.
export const RESTING_THICKNESS = DICTATION_PILL_RESTING_THICKNESS;
export const RESTING_LENGTH = DICTATION_PILL_RESTING_LENGTH;

// The resting sliver is a squircle rather than a half-round capsule.
export const HIDDEN_RADIUS = HIDDEN_THICKNESS / 2 + 4;
export const PILL_RADIUS = PILL_THICKNESS / 2;
export const DICTATING_RADIUS = PILL_RADIUS;
export const RESTING_RADIUS = RESTING_THICKNESS / 2;

/**
 * The one pill has four shapes: a resting sliver, the mark-bearing pill that
 * replaces the sliver when the pill is not minimized, the two-up launcher, and
 * an active dictation session. Each maps to one size the shell animates
 * between.
 */
export type DictationPillMode = "hidden" | "resting" | "open" | "dictating";

export type DictationPillSize = {
  width: number;
  height: number;
  radius: number;
};

/** A drag should not pop the launcher open under the cursor. */
export function resolveDictationPillMode(params: {
  state: DictationState;
  isHovered: boolean;
  isDragging: boolean;
  /** False rests the pill as the mark instead of the slim nub. */
  minimized?: boolean;
  /** A session just landed: it comes home before anything else can open. */
  settling?: boolean;
}): DictationPillMode {
  if (params.state !== "idle") return "dictating";
  const atRest = params.minimized === false ? "resting" : "hidden";
  // Finishing by a click leaves the cursor on the pill; the launcher must not
  // pop open over the ending.
  if (params.settling || params.isDragging) return atRest;
  return params.isHovered ? "open" : atRest;
}

/**
 * A dictation run over a meeting takes the mic away from that meeting's
 * recording for its span. The pill has to say so, or the gap in the meeting's
 * audio would look like a fault: the label rides in the tooltip box while the
 * meter shows the dictation.
 */
export const MEETING_MIC_PAUSED_LABEL = "Meeting mic paused";

export function showsMeetingMicPaused(params: {
  mode: DictationPillMode;
  state: DictationState;
  meetingActive?: boolean;
}): boolean {
  return (
    params.mode === "dictating" &&
    params.state === "recording" &&
    params.meetingActive === true
  );
}

export function isDictationPillLive(mode: DictationPillMode): boolean {
  return mode === "dictating";
}

/** One curve for every move the pill makes: a brisk start that eases home. */
export const PILL_BEZIER = [0.32, 0.72, 0, 1] as const;
/** The curve a landed session comes home on: a plain, even ease-out. */
export const SETTLE_BEZIER = [0.22, 0.61, 0.36, 1] as const;

// The durations live in the layout module so the main process can time the
// windows that follow the pill's morph.
export { REST_MORPH_MS, WAKE_MORPH_MS };
/**
 * A landed session comes home in one long motion: the shell shrinks to the jar
 * while the embers drift into it, all on the same curve, starting a beat after
 * the transcript lands.
 */
export const SETTLE_MORPH_MS = 1400;
export const SETTLE_DELAY_MS = 100;

/**
 * Waking, the corner radius settles sooner than the size so the sliver's
 * squircle does not linger while the capsule is already at full size.
 */
export const RADIUS_MORPH_MS = 340;

export type DictationPillMorph = {
  duration: number;
  bezier: readonly [number, number, number, number];
  /** The corner radius keeps its own, quicker pace except when settling. */
  radiusMs: number;
  /** How long the shell waits before it starts to move. */
  delayMs: number;
};

/**
 * How the shell, and everything riding in it, travels to a shape. Settling —
 * a session giving way to rest — is its own, slower gesture, and the corners
 * round off with it rather than squaring up while the shell is still large.
 */
export function dictationPillMorph(
  mode: DictationPillMode,
  settling: boolean,
): DictationPillMorph {
  if (settling) {
    return {
      duration: SETTLE_MORPH_MS,
      bezier: SETTLE_BEZIER,
      radiusMs: SETTLE_MORPH_MS,
      delayMs: SETTLE_DELAY_MS,
    };
  }
  const resting = mode === "hidden" || mode === "resting";
  return {
    duration: resting ? REST_MORPH_MS : WAKE_MORPH_MS,
    bezier: PILL_BEZIER,
    radiusMs: RADIUS_MORPH_MS,
    delayMs: 0,
  };
}

export function isDictationPillVertical(side: DictationPillSide): boolean {
  return side === "left" || side === "right";
}

const LENGTHS: Record<DictationPillMode, number> = {
  hidden: HIDDEN_LENGTH,
  resting: RESTING_LENGTH,
  open: OPEN_LENGTH,
  dictating: DICTATING_LENGTH,
};

const THICKNESSES: Record<DictationPillMode, number> = {
  hidden: HIDDEN_THICKNESS,
  resting: RESTING_THICKNESS,
  open: PILL_THICKNESS,
  dictating: DICTATING_THICKNESS,
};

const RADII: Record<DictationPillMode, number> = {
  hidden: HIDDEN_RADIUS,
  resting: RESTING_RADIUS,
  open: PILL_RADIUS,
  dictating: DICTATING_RADIUS,
};

/** Side docks run the same pill on its end, so length and thickness swap. */
export function getDictationPillSize(
  mode: DictationPillMode,
  vertical: boolean,
): DictationPillSize {
  const length = LENGTHS[mode];
  const thickness = THICKNESSES[mode];
  const radius = RADII[mode];
  return vertical
    ? { width: thickness, height: length, radius }
    : { width: length, height: thickness, radius };
}

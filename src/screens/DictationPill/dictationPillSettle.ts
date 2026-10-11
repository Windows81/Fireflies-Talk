import type { DictationState } from "electron/src/types";
import {
  isDictationPillLive,
  type DictationPillMode,
} from "./dictationPillMode";

/**
 * The gesture of a session landing, as the design's "diagonal · smoother"
 * prototype plays it. Nothing waits for anything else: in one 1.4s motion the
 * shell shrinks to the jar while the embers surface among the fading sparks
 * and drift into it, each on its own diagonal, burning brighter than rest with
 * the edge warm beneath them. Then the settle lets go and they dim to rest.
 */

/** How long the pill is "settling": held at rest, warm, embers bright. */
export const SETTLE_HOLD_MS = 1700;
/** The sparks and the mark dissolve over this long as the jar closes. */
export const SETTLE_SPARKS_FADE_MS = 700;
export const SETTLE_MARK_FADE_MS = 800;
/** Embers set off this far apart, and each fades in (and later dims) over this long. */
export const SETTLE_STAGGER_MS = 100;
export const SETTLE_EMBER_FADE_MS = 800;
/** The warmth on the edge: a beat late, and the last thing to go. */
export const SETTLE_WARMTH_DELAY_MS = 300;
export const SETTLE_WARMTH_MS = 1200;

/** What the pill was showing, and what the session underneath was doing. */
export type DictationPillMoment = {
  mode: DictationPillMode;
  state: DictationState;
};

/**
 * A session has landed: the pill was wearing the meter and no longer is, and
 * the session finished rather than being cancelled. A dictation that ends is
 * transcribing ("processing") when the pill lets go of it; one cancelled with
 * Escape goes from "recording" straight to idle, produced nothing, and gets no
 * landing. The launcher closing, or a drag, is not a settle — nothing was
 * running.
 */
export function isDictationPillSettle(
  previous: DictationPillMoment,
  next: DictationPillMoment,
): boolean {
  if (!isDictationPillLive(previous.mode) || isDictationPillLive(next.mode)) {
    return false;
  }
  return previous.state === "processing";
}

/**
 * Whether the pill is settling after this change. A settle that has begun
 * survives the hover flag dropping or a drag ending — the cursor leaving the
 * pill a moment after the click is the normal case — and ends early only for a
 * new session.
 */
export function resolveDictationPillSettling(
  previous: DictationPillMoment,
  next: DictationPillMoment,
  wasSettling: boolean,
): boolean {
  if (isDictationPillSettle(previous, next)) return true;
  return wasSettling && !isDictationPillLive(next.mode);
}

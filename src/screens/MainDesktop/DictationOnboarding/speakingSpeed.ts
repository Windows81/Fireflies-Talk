/**
 * Words per minute for the onboarding's closing comparison. The typing figure
 * is the widely quoted average for a proficient typist, held as a constant so
 * the two numbers on screen come from the same place.
 */
export const AVERAGE_TYPING_WPM = 50;

/** Shorter than this and a stray word or two swings the rate wildly. */
const MIN_MEASURABLE_MS = 1_000;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Rate for one dictation, or null when there is nothing meaningful to measure
 * — no words, or a burst too short to divide by.
 */
export function speakingWordsPerMinute(
  text: string,
  durationMs: number,
): number | null {
  if (durationMs < MIN_MEASURABLE_MS) return null;
  const words = countWords(text);
  if (words === 0) return null;
  return Math.round((words / durationMs) * 60_000);
}

export function speedMultiplier(wpm: number): number {
  return wpm / AVERAGE_TYPING_WPM;
}

/**
 * "2x" / "2.1x" — a whole number loses the decimal, since "2.0x" reads like
 * false precision on a figure this rough.
 */
export function formatMultiplier(multiplier: number): string {
  const rounded = Math.round(multiplier * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}x` : `${rounded.toFixed(1)}x`;
}

/** Below this the "faster" claim is not worth making. */
export function isFasterThanTyping(wpm: number): boolean {
  return speedMultiplier(wpm) >= 1.1;
}

/** Days to wait after user submits feedback before starting a new cycle */
export const COOLDOWN_DAYS_AFTER_SUBMIT = 60;

/** Days to wait after max shows reached (no feedback) before starting a new cycle */
export const COOLDOWN_DAYS_AFTER_MAX_SHOWN = 14;

/** Minimum successful recordings before the nudge becomes eligible */
export const MIN_RECORDINGS_BEFORE_NUDGE = 3;

/** Maximum times the nudge can be shown per cycle */
export const MAX_SHOWS_PER_CYCLE = 2;

/** Delay in ms before showing the nudge after a trigger event (avoids interrupting success toast) */
export const NUDGE_DELAY_MS = 3000;

export const FEEDBACK_NUDGE_MODAL_NAME = "feedback-nudge";

export const NUDGE_FEEDBACK_CATEGORIES = [
  "Recording quality",
  "Meeting summaries",
  "Performance",
  "User interface",
  "Other",
] as const;

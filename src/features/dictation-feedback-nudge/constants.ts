/**
 * Spoken-dictation counts at which the feedback popover is offered. Each entry
 * is one offer: dismissing an offer only spends that milestone, so the next
 * offer comes at the next milestone; submitting ends the nudge forever.
 */
export const TALK_FEEDBACK_NUDGE_MILESTONES = [10, 25, 50, 100] as const;

/** A milestone this close after a show is skipped, so two offers never land back to back. */
export const TALK_FEEDBACK_NUDGE_SKIP_WINDOW = 10;

/** Minimum time between two offers. */
export const TALK_FEEDBACK_NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Delay before the feedback popover appears beside the pill, so the
 * dictation finishes pasting and the pill's own toast is not cut short.
 */
export const DICTATION_FEEDBACK_NUDGE_DELAY_MS = 3000;

/** How long the card's thank-you beat stays up after a submit. */
export const DICTATION_FEEDBACK_THANKS_MS = 1500;

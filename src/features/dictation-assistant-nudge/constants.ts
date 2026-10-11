/**
 * Successful pastes into the assistant's app at which it is offered. Each
 * show spends one, so the next offer comes at the next milestone.
 */
export const ASSISTANT_NUDGE_MILESTONES = [3, 20, 50, 100] as const;

/** Minimum time between two shows of the same assistant, on any device. */
export const ASSISTANT_NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Delay before the card appears, so the paste lands and the pill's own
 * toast is not cut short.
 */
export const ASSISTANT_NUDGE_DELAY_MS = 3000;

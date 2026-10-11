import {
  ASSISTANT_NUDGE_COOLDOWN_MS,
  ASSISTANT_NUDGE_MILESTONES,
} from "./constants";

export interface NudgeShows {
  /** Shows actually put on screen, on any device. */
  timesSeen: number;
  /** Epoch ms of the last show on any device; null before the first. */
  lastTimeSeen: number | null;
}

const inCooldown = (shows: NudgeShows, now: number): boolean =>
  shows.lastTimeSeen !== null &&
  now - shows.lastTimeSeen < ASSISTANT_NUDGE_COOLDOWN_MS;

/**
 * Owed when the milestone at `timesSeen` is reached and the cooldown is over.
 * A milestone reached inside the cooldown is not lost; the next counted paste
 * owes it.
 */
export function isNudgeOwed(
  pastes: number,
  shows: NudgeShows,
  now = Date.now(),
): boolean {
  const milestone = ASSISTANT_NUDGE_MILESTONES.at(shows.timesSeen);

  return (
    milestone !== undefined && pastes >= milestone && !inCooldown(shows, now)
  );
}

export function isNudgeSpent(shows: NudgeShows): boolean {
  return shows.timesSeen >= ASSISTANT_NUDGE_MILESTONES.length;
}

/** The card reached the screen: spend the milestone, start the cooldown. */
export function markNudgeShown<S extends NudgeShows>(prev: S, now: number): S {
  return {
    ...prev,
    timesSeen: prev.timesSeen + 1,
    lastTimeSeen: now,
  };
}

export function hasNewerServerShows(
  prev: NudgeShows,
  server: NudgeShows,
): boolean {
  return (
    server.timesSeen > prev.timesSeen ||
    (server.lastTimeSeen ?? 0) > (prev.lastTimeSeen ?? 0)
  );
}

/**
 * Folds another device's shows in. Its shows advance this schedule, and its
 * last show starts the cooldown here. An older record never rolls this device
 * back.
 */
export function adoptServerShows<S extends NudgeShows>(
  prev: S,
  server: NudgeShows,
): S {
  return {
    ...prev,
    timesSeen: Math.max(prev.timesSeen, server.timesSeen),
    lastTimeSeen:
      server.lastTimeSeen === null
        ? prev.lastTimeSeen
        : Math.max(prev.lastTimeSeen ?? 0, server.lastTimeSeen),
  };
}

export function parseServerShows(
  timesSeen: number | null | undefined,
  lastTimeSeen: string | null | undefined,
): NudgeShows {
  const parsed = Date.parse(lastTimeSeen ?? "");

  return {
    timesSeen: timesSeen ?? 0,
    lastTimeSeen: Number.isNaN(parsed) ? null : parsed,
  };
}

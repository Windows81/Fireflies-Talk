import type { ConsentDeliveryStatus } from "@/features/live-record/consent-delivery.store";

/**
 * What one consent channel is doing for the current recording, from the
 * banner's point of view.
 *
 * - `off`: the channel is disabled or has no way to reach this meeting.
 * - `pending`: enabled and not yet resolved (scheduled, in flight, retrying).
 * - `delivered`: participants were notified.
 * - `failed`: enabled but terminally unable to notify.
 */
export type ConsentChannelOutcome = "off" | "pending" | "delivered" | "failed";

/** Maps a channel's delivery status to an outcome, with `off` when it cannot run. */
export function consentChannelOutcome(
  canRun: boolean,
  status: ConsentDeliveryStatus | undefined,
): ConsentChannelOutcome {
  if (!canRun) return "off";
  if (status === "delivered" || status === "failed") return status;
  return "pending";
}

/**
 * The manual banner is the fallback of last resort: it is needed only when no
 * channel notified participants and none still can. One delivery is enough to
 * hide it, and a channel still in flight holds it back so it does not flash
 * while an announcement is on its way.
 */
export function needsManualConsent(
  outcomes: readonly ConsentChannelOutcome[],
): boolean {
  return !outcomes.includes("delivered") && !outcomes.includes("pending");
}

import type { ConsentChannel } from "@/features/recording-consent";
import type { DesktopConsentPolicy } from "./desktopConsentPolicy";

const CHANNELS: readonly ConsentChannel[] = ["audio", "camera", "chat"];

/**
 * The required notices the consent card shows on this device. A row the card
 * cannot offer here (the camera on a device that cannot run it, the chat
 * notice off macOS) is not one it can tell the member about.
 */
export function shownConsentRequirements(
  policy: DesktopConsentPolicy,
  available: { camera: boolean; chat: boolean },
): ConsentChannel[] {
  return CHANNELS.filter(
    (channel) => policy[channel] && (channel === "audio" || available[channel]),
  );
}

/**
 * Whether the card has a requirement to show that this member has not seen it
 * name since it became required, which is what brings the card back.
 */
export function hasUnseenConsentRequirement(
  shown: readonly ConsentChannel[],
  seen: readonly ConsentChannel[],
): boolean {
  return shown.some((channel) => !seen.includes(channel));
}

/** Forgets a lifted requirement, so requiring it again later counts as new. */
export function withoutLiftedRequirements(
  seen: readonly ConsentChannel[],
  policy: DesktopConsentPolicy,
): ConsentChannel[] {
  return seen.filter((channel) => policy[channel]);
}

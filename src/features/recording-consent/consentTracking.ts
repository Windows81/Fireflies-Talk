import { getDesktopConsentPolicy } from "@/features/consent-policy/consentPolicy.store";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { getActualPlatform } from "@/utils/device";

/** The three ways the app can tell participants that a recording has started. */
export type ConsentChannel = "audio" | "camera" | "chat";

/** Where the user changed a channel, so the two surfaces stay comparable. */
export type ConsentSource = "consent-setup" | "settings";

/** How the one-time setup card was answered. */
export type ConsentSetupOutcome =
  | "continue"
  | "dismissed"
  | "start-anyway"
  | "camera-approved"
  | "interrupted";

/**
 * What every consent channel is set to. `null` means this platform cannot offer
 * the channel — the camera notice needs macOS or Windows, the chat notice rides
 * the macOS-only accessibility keyboard module — because reporting those as
 * `false` would read as a user who switched them off.
 */
export interface ConsentSnapshot {
  /** Plays through the speakers, so every platform can offer it. */
  audio: boolean;
  camera: boolean | null;
  chat: boolean | null;
}

/** Flat, so Segment can filter on each requirement without unpacking an object. */
function requiredProperties() {
  const required = getDesktopConsentPolicy();
  return {
    requiredAudio: required.audio,
    requiredCamera: required.camera,
    requiredChat: required.chat,
  };
}

export function trackConsentUpdated({
  channel,
  enabled,
  snapshot,
  source,
}: {
  channel: ConsentChannel;
  enabled: boolean;
  snapshot: ConsentSnapshot;
  source: ConsentSource;
}): void {
  tracker.track(TRACKING_EVENTS.DESKTOP_RECORDING_CONSENT_UPDATED, {
    changed: channel,
    enabled,
    source,
    ...snapshot,
    ...requiredProperties(),
    // Callers report the snapshot they can see, which is the state before their
    // own write lands. Overriding here is what stops an event from claiming
    // `changed: "audio", enabled: true` next to `audio: false`.
    [channel]: enabled,
  });
}

export function trackConsentSetupShown(): void {
  // Which rows the card offers is not yet known this early — the camera status
  // is one IPC round trip away — and the platform is what decides them.
  tracker.track(TRACKING_EVENTS.DESKTOP_CONSENT_SETUP_SHOWN, {
    platform: getActualPlatform(),
  });
}

export function trackConsentSetupAnswered({
  outcome,
  snapshot,
  cameraApprovalNeeded,
}: {
  outcome: ConsentSetupOutcome;
  snapshot: ConsentSnapshot;
  /** The card sent the user to System Settings to allow the extension. */
  cameraApprovalNeeded: boolean;
}): void {
  tracker.track(TRACKING_EVENTS.DESKTOP_CONSENT_SETUP_ANSWERED, {
    outcome,
    cameraApprovalNeeded,
    ...snapshot,
    ...requiredProperties(),
  });
}

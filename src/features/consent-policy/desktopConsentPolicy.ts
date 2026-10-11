import { Tier, isMinTier } from "@firefliesai/payments-ff.utils";

/** Shown wherever a switch is held on by the team's policy. */
export const REQUIRED_BY_ADMIN_MESSAGE = "Required by your workspace admin";

/**
 * Which recording-consent notices the team's admins require of the desktop
 * app. `true` means the notice is on for every recording and the member cannot
 * switch it off.
 */
export interface DesktopConsentPolicy {
  /** The spoken message played through the speakers. */
  audio: boolean;
  /** The recording badge on the Fireflies camera. */
  camera: boolean;
  /** The message posted into the meeting chat. */
  chat: boolean;
}

export const NO_CONSENT_REQUIRED: DesktopConsentPolicy = {
  audio: false,
  camera: false,
  chat: false,
};

/** The slice of `teamAccount` the policy is resolved from; see consentPolicyQuery. */
export interface TeamConsentPolicySource {
  tier?: string | null;
  settings?: {
    enforceDesktopConsentAudio?: boolean | null;
    enforceDesktopConsentCamera?: boolean | null;
    enforceDesktopConsentChat?: boolean | null;
  } | null;
}

/**
 * Enforcement is a Business feature: below that tier every flag reads as off,
 * so a team that downgrades is never held to a setting its admins can no
 * longer see. A missing tier counts as below Business, the fail-open side.
 */
export function resolveDesktopConsentPolicy(
  team: TeamConsentPolicySource | null | undefined,
): DesktopConsentPolicy {
  if (!team || !isMinTier(team.tier as Tier, Tier.BUSINESS)) {
    return NO_CONSENT_REQUIRED;
  }
  return {
    audio: Boolean(team.settings?.enforceDesktopConsentAudio),
    camera: Boolean(team.settings?.enforceDesktopConsentCamera),
    chat: Boolean(team.settings?.enforceDesktopConsentChat),
  };
}

export function isSameDesktopConsentPolicy(
  a: DesktopConsentPolicy,
  b: DesktopConsentPolicy,
): boolean {
  return a.audio === b.audio && a.camera === b.camera && a.chat === b.chat;
}

export function anyConsentRequired(policy: DesktopConsentPolicy): boolean {
  return policy.audio || policy.camera || policy.chat;
}

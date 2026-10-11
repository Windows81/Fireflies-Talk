/**
 * How the floating pill presents itself to a user who has not yet made Talk
 * theirs: as the normal launcher, as an inert sliver under a "Try Talk" card,
 * or not at all.
 */
export type TalkPillPresence = "interactive" | "teaser" | "hidden";

export const TALK_PILL_TEASER_INSTALL_DELAY_MS = 24 * 60 * 60 * 1000;

export function isTalkTeaserInstallDelayOver(
  installedAt: number | null,
  now: number,
): boolean {
  // Installs predating the field have no timestamp; treat them as old enough.
  if (installedAt === null) return true;
  return now - installedAt >= TALK_PILL_TEASER_INSTALL_DELAY_MS;
}

export interface TalkPillTeaserInput {
  flagOn: boolean;
  onboardingDone: boolean;
  /**
   * The card was closed, Try was clicked, or the onboarding was opened some
   * other way; any of them is remembered for good on this installation.
   */
  dismissed: boolean;
  hasDictations: boolean;
  /** Epoch ms of the app's first open; null when unknown (installs predating the field). */
  installedAt: number | null;
  now: number;
}

export interface TalkPillPresenceInput extends TalkPillTeaserInput {
  signedIn: boolean;
  onboardingOpen: boolean;
}

export function resolveTalkPillPresence(
  input: TalkPillPresenceInput,
): TalkPillPresence {
  const {
    flagOn,
    onboardingDone,
    dismissed,
    hasDictations,
    signedIn,
    onboardingOpen,
    installedAt,
    now,
  } = input;
  // Nobody to introduce Talk to yet; the pill is off anyway while signed out.
  if (!signedIn) return "interactive";
  // Anyone Talk already belongs to keeps the pill exactly as it is, and the
  // onboarding owns the pill outright while it runs — its demo steps show it.
  if (!flagOn || onboardingDone || hasDictations || onboardingOpen) {
    return "interactive";
  }
  // The teaser stays away for the app's first day so a fresh install can
  // settle before it starts pitching Talk; the pill just behaves normally.
  if (!isTalkTeaserInstallDelayOver(installedAt, now)) return "interactive";
  // Once the card has been acted on, the onboarding decides when the pill
  // comes back: it stays away until the user finishes (or dictates anyway).
  return dismissed ? "hidden" : "teaser";
}

export function shouldShowTalkPillTeaser(input: TalkPillTeaserInput): boolean {
  return (
    resolveTalkPillPresence({
      ...input,
      signedIn: true,
      onboardingOpen: false,
    }) === "teaser"
  );
}

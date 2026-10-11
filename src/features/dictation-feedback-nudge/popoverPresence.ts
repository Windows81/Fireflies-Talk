export interface TalkFeedbackPopoverInput {
  /** An offer is earned at the current milestone and still unspent. */
  nudgePending: boolean;
  /**
   * Onboarding owns the pill while it runs (its demo steps show it), so the
   * popover waits it out. Read from the persisted user flag, not the open
   * store — the open flag races with the onboarding's own cleanup.
   */
  onboardingDone: boolean;
  signedIn: boolean;
  /** Talk itself is enabled for this account. */
  flagOn: boolean;
  /**
   * Server state already settled the nudge: the completed flag is set, or the
   * server-side show count already reached the last milestone on another
   * device. Checked at the gate so a stale local pending cannot slip through.
   */
  serverCompleted: boolean;
}

/** Whether the pill-anchored feedback popover should be on screen. */
export function resolveTalkFeedbackPopoverWanted(
  input: TalkFeedbackPopoverInput,
): boolean {
  return (
    input.nudgePending &&
    input.signedIn &&
    input.flagOn &&
    input.onboardingDone &&
    !input.serverCompleted
  );
}

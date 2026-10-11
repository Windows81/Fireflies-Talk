/**
 * Fireflies Talk is offered on this device when the flag is on, the account
 * policy has loaded, and the desktop platform has the dictation runtime —
 * regardless of whether the user or their team has turned Talk off. Surfaces
 * that should keep showing Talk entry points (the home and settings Dictation
 * tabs) follow this answer so they can offer turning it back on.
 */
export function isDictationOffered(opts: {
  flagOn: boolean;
  platform: string;
  policyResolved: boolean;
}): boolean {
  return (
    opts.flagOn &&
    opts.policyResolved &&
    (opts.platform === "darwin" || opts.platform === "win32")
  );
}

/**
 * Fireflies Talk exists for a user when it is offered on this device and
 * neither they nor their team has turned Talk off. A team-level off fully
 * binds non-admins; team admins can opt back in for themselves, so their own
 * user-level setting is what decides. Everything the Universal Pill shipped
 * with — the pill, Talk shortcuts, and the live surfaces that share the
 * pill's surface — follows this one answer.
 */
export function isDictationAvailable(opts: {
  flagOn: boolean;
  platform: string;
  disabledByUser: boolean;
  disabledByTeam: boolean;
  isTeamAdmin: boolean;
  policyResolved: boolean;
}): boolean {
  return (
    isDictationOffered({
      flagOn: opts.flagOn,
      platform: opts.platform,
      policyResolved: opts.policyResolved,
    }) &&
    !opts.disabledByUser &&
    !(opts.disabledByTeam && !opts.isTeamAdmin)
  );
}

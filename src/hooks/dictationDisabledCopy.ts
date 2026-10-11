export interface TalkDisabledCopy {
  title: string;
  description: string;
  canTurnOn: boolean;
  /** Present when canTurnOn is true — what the button says. */
  turnOnLabel?: string;
}

/**
 * The copy shown where Talk used to work once it is off. A team-level off
 * only binds non-admins — admins get the self-serve "Turn on for me", which
 * clears their own metadata even though the team setting stays on.
 */
export function getTalkDisabledCopy(policy: {
  disabledByUser: boolean;
  disabledByTeam: boolean;
  isTeamAdmin: boolean;
}): TalkDisabledCopy {
  if (policy.disabledByTeam && !policy.isTeamAdmin) {
    return {
      title: "Fireflies Talk is turned off for your team",
      description:
        "A team admin turned Fireflies Talk off. Ask an admin to turn it back on in team settings.",
      canTurnOn: false,
    };
  }

  if (policy.disabledByTeam) {
    return {
      title: "Fireflies Talk is turned off for your team",
      description:
        "Fireflies Talk is turned off in your team settings. You can turn it back on just for yourself here, or for everyone from the dashboard team settings.",
      canTurnOn: true,
      turnOnLabel: "Turn on for me",
    };
  }

  return {
    title: "Fireflies Talk is turned off",
    description:
      "Dictation, the floating pill, and Talk shortcuts are off for your account.",
    canTurnOn: true,
    turnOnLabel: "Turn on",
  };
}

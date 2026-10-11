interface AssistantNudgeInput {
  owed: boolean;
  signedIn: boolean;
  nudgeFlagOn: boolean;
  canAccess: boolean;
}

/**
 * Whether an assistant card may be offered. It is only asked right after a
 * Talk paste, so Talk itself is known to be available. Whether the assistant
 * is already set up is a network check made at offer time.
 */
export function resolveAssistantNudgeWanted(
  input: AssistantNudgeInput,
): boolean {
  return input.owed && input.signedIn && input.nudgeFlagOn && input.canAccess;
}

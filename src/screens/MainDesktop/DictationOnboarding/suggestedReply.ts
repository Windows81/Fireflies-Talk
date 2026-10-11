/** First word of a display name, or "" when there is nothing to greet by. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** The reply the hands-free demo suggests, signed by the user when we know them. */
export function handsFreeSuggestedLine(userName: string): string {
  const firstName = firstNameOf(userName);
  const signOff = firstName ? `Best ${firstName}` : "Best";
  return `Hi David, thanks for the chat today. Are you free for a follow-up call Monday at 3? ${signOff}`;
}

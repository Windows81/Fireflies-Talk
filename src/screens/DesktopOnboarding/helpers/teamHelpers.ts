type TeammateWithProfile = {
  name?: string | null;
  profile?: { firstName?: string | null } | null;
};

type TeamWithName = {
  name?: string | null;
};

export function getTeammateFirstName(
  teammate: TeammateWithProfile | null | undefined,
): string {
  if (!teammate) return "";
  return teammate?.profile?.firstName ?? teammate?.name?.split(" ")[0] ?? "";
}

export function hasCustomTeamName(
  team: TeamWithName | null | undefined,
): boolean {
  if (!team?.name) return false;
  return team.name !== "Fireflies";
}

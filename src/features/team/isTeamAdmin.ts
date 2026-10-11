import type { GetTeamQuery } from "@/graphql";

/** Whether the user is an admin of this team, whichever field marks it. */
export const isTeamAdmin = (
  team: GetTeamQuery["team"] | null | undefined,
  userId: string | undefined,
): boolean =>
  Boolean(
    userId &&
      team &&
      (team.admin === userId ||
        team.admins?.includes(userId) ||
        team.teammates?.find((teammate) => teammate?.id === userId)?.isAdmin),
  );

import { useAuth } from "@/features/auth";
import { useGetTeamQuery } from "@/graphql";
import { useGetUserGroupsQuery } from "@firefliesai/payments-ff.graphql-client";
import { isTeamAdmin } from "./isTeamAdmin";

export const useTeam = (options?: { skip?: boolean }) => {
  const { user } = useAuth();

  const { data, loading, error } = useGetTeamQuery({
    skip: !user || options?.skip,
    fetchPolicy: "cache-and-network",
  });
  const team = data?.team;

  const userId = user?.notebookId || user?.id;

  const isAdmin = isTeamAdmin(team, userId);

  const { data: userGroupsData, loading: userGroupsLoading } =
    useGetUserGroupsQuery({
      skip: !user || options?.skip,
    });

  const userGroups = userGroupsData?.getUserGroups;

  const autoJoinSettingsLocked = !!team?.settings?.autoJoin && !isAdmin;
  const privacySettingsLocked = !!team?.settings?.privacy && !isAdmin;
  const sendNotesToSettingsLocked = !!team?.settings?.sendNotesTo && !isAdmin;

  return {
    team,
    loading: loading || userGroupsLoading,
    // Team query only, without user-groups; callers that gate on the team
    // itself must not wait on the unrelated user-groups request.
    teamLoading: loading,
    error,
    isAdmin,
    userGroups,
    privacySettingsLocked,
    autoJoinSettingsLocked,
    sendNotesToSettingsLocked,
  };
};

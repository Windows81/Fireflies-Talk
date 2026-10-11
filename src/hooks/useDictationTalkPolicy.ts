import { useAuth } from "@/features/auth";
import { isTeamAdmin } from "@/features/team";
import { useGetCurrentUserQuery, useGetTeamQuery } from "@/graphql";

export type DictationTalkPolicy = {
  /** The user turned Talk off in settings (account-level, self-serve). */
  disabledByUser: boolean;
  /** A team admin turned Talk off. Admins can still opt back in for themselves. */
  disabledByTeam: boolean;
  /** The user is a team admin, so a team-level off doesn't fully bind them. */
  isTeamAdmin: boolean;
  /**
   * Both queries returned data. Until then Talk fails closed (unavailable),
   * so a disabled account never gets it while the policy is still loading.
   */
  resolved: boolean;
  loading: boolean;
};

/**
 * Who turned Fireflies Talk off for this account. Both queries are
 * cache-and-network: they read the startup-fetched data and also refresh it.
 */
export const useDictationTalkPolicy = (): DictationTalkPolicy => {
  const { user } = useAuth();
  const {
    data: userData,
    error: userError,
    loading: userLoading,
  } = useGetCurrentUserQuery({
    skip: !user,
    fetchPolicy: "cache-and-network",
  });
  const {
    data: teamData,
    error: teamError,
    loading: teamLoading,
  } = useGetTeamQuery({
    skip: !user,
    fetchPolicy: "cache-and-network",
  });

  return {
    disabledByUser: Boolean(userData?.user?.userMetaData?.disableFirefliesTalk),
    disabledByTeam: Boolean(teamData?.team?.settings?.disableFirefliesTalk),
    isTeamAdmin: isTeamAdmin(teamData?.team, user?.notebookId || user?.id),
    resolved:
      Boolean(userData?.user) && Boolean(teamData) && !userError && !teamError,
    loading: userLoading || teamLoading,
  };
};

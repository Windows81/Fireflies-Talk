import {
  useGetCurrentUserQuery,
  useGetTeamOnboardingSuggestionQuery,
} from "@/graphql";
import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";

export const useGetTeamOnboardingSuggestion = () => {
  const { user } = useAuth();

  const { data: dataUser, loading: loadingUser } = useGetCurrentUserQuery({
    skip: !user,
  });

  const { team, loading: loadingTeam } = useTeam();

  // TODO: Will add this back in when we have full feature
  const isAllowedToGetTeamOnboardingSuggestion = (() => {
    // The user does not team onboarding if:
    // 1. The user is not logged in
    // 2. The user has already completed the team onboarding
    // 3. The user already in a team (team has more than 1 teammate)
    // 4. The user has skipped the setup
    // 5. The user is not in the free tier

    if (
      !dataUser?.user ||
      !team ||
      (team?.teammates && team.teammates.length > 1) ||
      // dataUser.user.skipSetup ||
      dataUser.user.tier !== "free"
    ) {
      return false;
    }
    return true;
  })();

  const { data: dataTeamOnboarding, loading: loadingTeamOnboarding } =
    useGetTeamOnboardingSuggestionQuery({
      skip: !isAllowedToGetTeamOnboardingSuggestion,
    });

  const teamOnboardingSuggestion = dataTeamOnboarding?.teamOnboardingSuggestion;

  return {
    teamOnboardingSuggestion,
    loading: loadingTeamOnboarding || loadingUser || loadingTeam,
  };
};

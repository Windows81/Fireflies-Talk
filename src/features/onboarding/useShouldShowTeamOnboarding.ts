import { useGetCurrentUserQuery } from "@/graphql";
import { useAuth } from "../auth";
import { OnboardingStep, TeamOnboardingSuggestionType } from "./constants";
import { useGetTeamOnboardingSuggestion } from "./useGetTeamOnboardingSuggestion";

export const useShouldShowTeamOnboarding = () => {
  const { user } = useAuth();
  const { teamOnboardingSuggestion, loading } =
    useGetTeamOnboardingSuggestion();
  const { data: dataUser, loading: loadingUser } = useGetCurrentUserQuery({
    skip: !user,
  });

  return {
    shouldShowTeamOnboarding:
      !!dataUser?.user &&
      !loading &&
      !dataUser.user.onboardingStepsCompleted?.includes(
        OnboardingStep.TEAM_ONBOARDING,
      ) &&
      !!teamOnboardingSuggestion &&
      teamOnboardingSuggestion.suggestion !== TeamOnboardingSuggestionType.NONE,
    loading: loading || loadingUser,
  };
};

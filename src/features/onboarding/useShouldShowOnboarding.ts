import { useGetCurrentUserQuery } from "@/graphql";
import { OnboardingStep } from "./constants";
import { useShouldShowAutoJoinAndRecapOnboarding } from "./useShouldShowAutoJoinAndRecapOnboarding";
import { useShouldShowSelectLanguageOnboarding } from "./useShouldShowSelectLanguageStep";
import { useShouldShowTeamOnboarding } from "./useShouldShowTeamOnboarding";
import { useAuth } from "../auth";

export const useShouldShowOnboarding = () => {
  const { user } = useAuth();
  const {
    shouldShowAutoJoinAndRecapOnboarding,
    loading: loadingAutoJoinAndRecap,
  } = useShouldShowAutoJoinAndRecapOnboarding();
  const { shouldShowTeamOnboarding, loading: loadingTeamOnboarding } =
    useShouldShowTeamOnboarding();
  const {
    shouldShowSelectLanguageOnboarding,
    loading: loadingSelectLanguageOnboarding,
  } = useShouldShowSelectLanguageOnboarding();

  const { data: dataUser } = useGetCurrentUserQuery({
    skip: !user,
  });

  const loading =
    !dataUser?.user ||
    loadingAutoJoinAndRecap ||
    loadingTeamOnboarding ||
    loadingSelectLanguageOnboarding;

  const hasCompletedOnboardingStep =
    !!dataUser?.user?.onboardingStepsCompleted?.includes(
      OnboardingStep.COMPLETED,
    );

  const completed =
    hasCompletedOnboardingStep ||
    (!loading &&
      !shouldShowAutoJoinAndRecapOnboarding &&
      !shouldShowTeamOnboarding &&
      !shouldShowSelectLanguageOnboarding);

  return {
    shouldShowOnboardings:
      !loading &&
      !!dataUser?.user &&
      !completed &&
      (shouldShowAutoJoinAndRecapOnboarding ||
        shouldShowTeamOnboarding ||
        shouldShowSelectLanguageOnboarding),
    shouldShowAutoJoinAndRecapOnboarding,
    shouldShowTeamOnboarding,
    shouldShowSelectLanguageOnboarding,
    loading,
    completed,
  };
};

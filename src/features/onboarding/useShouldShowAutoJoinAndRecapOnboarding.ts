import { useGetCurrentUserQuery } from "@/graphql";
import { useAuth } from "../auth";
import { OnboardingStep } from "./constants";

export const useShouldShowAutoJoinAndRecapOnboarding = () => {
  const { user } = useAuth();
  const { data: dataUser, loading } = useGetCurrentUserQuery({
    skip: !user,
  });

  return {
    shouldShowAutoJoinAndRecapOnboarding:
      !!dataUser?.user &&
      !dataUser.user.onboardingStepsCompleted?.includes(OnboardingStep.SETUP),
    loading,
  };
};

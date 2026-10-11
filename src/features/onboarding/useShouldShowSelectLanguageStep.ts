import { useGetCurrentUserQuery } from "@/graphql";
import { useAuth } from "../auth";
import { OnboardingStep } from "./constants";

export const useShouldShowSelectLanguageOnboarding = () => {
  const { user } = useAuth();
  const { data: dataUser, loading } = useGetCurrentUserQuery({
    skip: !user,
  });

  return {
    shouldShowSelectLanguageOnboarding:
      !!dataUser?.user &&
      !loading &&
      !dataUser.user.onboardingStepsCompleted?.includes(
        OnboardingStep.SELECT_LANGUAGE,
      ),
    loading,
  };
};

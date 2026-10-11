import type { CompleteOnboardingStepMutationVariables } from "@/graphql";
import { createContext } from "react";
import type { useAutoJoinAndRecapStates } from "./AutoJoinAndRecap/AutoJoinAndRecap";
import type { useSelectLanguageStates } from "./SelectLanguage/SelectLanguage";
import type { useTeamOnboardingStates } from "./TeamOnboarding/TeamOnboarding";

export const OnboardingContext = createContext(
  {} as {
    index: number;
    goNext: () => void;
    goPrev: () => void;
    completeStep(variables: CompleteOnboardingStepMutationVariables): void;
  } & ReturnType<typeof useAutoJoinAndRecapStates> &
    ReturnType<typeof useTeamOnboardingStates> &
    ReturnType<typeof useSelectLanguageStates>,
);

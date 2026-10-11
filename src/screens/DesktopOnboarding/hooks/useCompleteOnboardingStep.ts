import { toast } from "@/components/Toast";
import type { CompleteOnboardingStepMutationVariables } from "@/graphql";
import {
  GetCurrentUserDocument,
  useCompleteOnboardingStepMutation,
} from "@/graphql";
import { useApolloClient } from "@apollo/client";
import { useCallback } from "react";
import { useOnboarding } from "../OnboardingContext";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { EnumOnboardingStep } from "@/graphql";

export function useCompleteOnboardingStep() {
  const { goNext } = useOnboarding();
  const client = useApolloClient();

  const [completeOnboardingStep, { loading }] =
    useCompleteOnboardingStepMutation({
      onError(err) {
        toast({
          message: err.message,
          type: "error",
        });
      },
    });

  /** Records a step server-side without advancing the flow. */
  const recordStep = useCallback(
    ({
      step,
      skip = false,
      extraInfo,
    }: CompleteOnboardingStepMutationVariables) =>
      completeOnboardingStep({
        variables: {
          step,
          skip,
          extraInfo: {
            ...extraInfo,
            source: "desktop-onboarding",
          },
        },
      }).then(() => {
        client.refetchQueries({
          include: [GetCurrentUserDocument],
        });
        const eventName =
          step === EnumOnboardingStep.Completed
            ? TRACKING_EVENTS.DESKTOP_APP_ONBOARDING_COMPLETED
            : TRACKING_EVENTS.DESKTOP_APP_ONBOARDING_STEP;
        tracker.track(eventName, {
          stepName: step,
          skip,
          extraInfo: {
            ...extraInfo,
            source: "desktop-onboarding",
          },
        });
      }),
    [completeOnboardingStep, client],
  );

  const completeStep = useCallback(
    (variables: CompleteOnboardingStepMutationVariables) => {
      recordStep(variables);
      goNext();
    },
    [recordStep, goNext],
  );

  return { completeStep, recordStep, loading };
}

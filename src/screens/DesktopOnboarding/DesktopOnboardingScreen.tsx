import { RouteNames } from "@/constants";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import type { ParamList } from "../types";
import {
  AllSetGettingReadyView,
  OnboardingCanvas,
  OnboardingWrapper,
} from "./components";
import {
  DesktopAutoJoinAndRecap,
  RoleSelection,
  SystemAudioSettings,
  TitleSelection,
  IntegrationPreference,
  DesktopInviteTeammates,
  SystemPermissions,
  DesktopJoinTeam,
  FreeTrialPitch,
  FreeTrialCardDetails,
} from "./components/steps";
import { OnboardingProvider, useOnboarding } from "./OnboardingContext";
import { useCompleteOnboardingStep } from "./hooks/useCompleteOnboardingStep";
import {
  EnumOnboardingStep,
  useApproveTermsMutation,
  useGetCurrentUserQuery,
} from "@/graphql";
import { useApolloClient } from "@apollo/client";
import {
  DESKTOP_FIRST_TIME_DEMO_FLAG_KEY,
  setLocalUserFlag,
} from "@/features/user-flags";

const StepRenderer: FC = () => {
  const { currentStep } = useOnboarding();

  switch (currentStep.stepName) {
    case "role":
      return <RoleSelection />;
    case "title":
      return <TitleSelection />;
    case "integrationPreference":
      return <IntegrationPreference />;
    case "autoJoinRecap":
      return <DesktopAutoJoinAndRecap />;
    case "systemAudioSettings":
      return <SystemAudioSettings />;
    case "inviteTeammates":
      return <DesktopInviteTeammates />;
    case "joinTeam":
      return <DesktopJoinTeam />;
    case "systemPermissions":
      return <SystemPermissions />;
    case "freeTrialPitch":
      return <FreeTrialPitch />;
    case "freeTrialCardDetails":
      return <FreeTrialCardDetails />;
    default:
      return null;
  }
};

type DesktopOnboardingContentProps = {
  navigation: NativeStackScreenProps<
    ParamList,
    "DesktopOnboarding"
  >["navigation"];
};

const DesktopOnboardingContent: FC<DesktopOnboardingContentProps> = ({
  navigation,
}) => {
  const { isCompleting } = useOnboarding();
  const { completeStep } = useCompleteOnboardingStep();
  const client = useApolloClient();
  const { data: currentUserData } = useGetCurrentUserQuery();
  const [approveTerms] = useApproveTermsMutation({
    onCompleted() {
      const user = currentUserData?.user;
      if (user) {
        client.cache.modify({
          id: client.cache.identify(user),
          fields: {
            approvedTerms() {
              return true;
            },
          },
        });
      }
    },
  });

  if (isCompleting) {
    return (
      <AllSetGettingReadyView
        onNavigate={() => {
          completeStep({
            step: EnumOnboardingStep.Completed,
            skip: false,
            extraInfo: {
              stepsToShow: [],
            },
          });
          approveTerms();
          setLocalUserFlag(DESKTOP_FIRST_TIME_DEMO_FLAG_KEY, true);
          navigation.replace(RouteNames.MainDesktop, {
            fromDesktopOnboarding: true,
          });
        }}
      />
    );
  }

  return (
    <OnboardingCanvas>
      <OnboardingWrapper>
        <StepRenderer />
      </OnboardingWrapper>
    </OnboardingCanvas>
  );
};

export const DesktopOnboardingScreen: FC<
  NativeStackScreenProps<ParamList, "DesktopOnboarding">
> = ({ navigation, route }) => {
  const existingUserDemo = route.params?.existingUserDemo;

  if (existingUserDemo) {
    return (
      <AllSetGettingReadyView
        onNavigate={() => {
          setLocalUserFlag(DESKTOP_FIRST_TIME_DEMO_FLAG_KEY, true);
          navigation.replace(RouteNames.MainDesktop, {
            fromDesktopOnboarding: true,
          });
        }}
      />
    );
  }

  return (
    <OnboardingProvider>
      <DesktopOnboardingContent navigation={navigation} />
    </OnboardingProvider>
  );
};

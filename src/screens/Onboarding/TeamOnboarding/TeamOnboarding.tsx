import { IconUsers } from "@/assets/svg";
import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/Loading";
import {
  TeamOnboardingSuggestionType,
  useGetTeamOnboardingSuggestion,
} from "@/features/onboarding";
import { EnumOnboardingStep } from "@/graphql";
import { useTheme } from "@/styles";
import { useContext, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingContext } from "../Context";
import { HeaderBlock } from "../components/HeaderBlock";
import { teamOnboardingSuggestionToTrackingEnumMap } from "../constants";
import {
  TeamOnboardingInvite,
  TeamOnboardingInviteFooter,
} from "./TeamOnboardingInvite";
import {
  TeamOnboardingRequestTeams,
  TeamOnboardingRequestTeamsFooter,
} from "./TeamOnboardingRequestTeams";

const teamOnboardingComponentMap = {
  [TeamOnboardingSuggestionType.INVITE]: TeamOnboardingInvite,
  [TeamOnboardingSuggestionType.INVITE_SUGGESTION]: TeamOnboardingInvite,
  [TeamOnboardingSuggestionType.REQUEST_TEAMS]: TeamOnboardingRequestTeams,
  [TeamOnboardingSuggestionType.NONE]: null,
  [TeamOnboardingSuggestionType.AUTO_ADD_TEAM]: null,
};

export const TeamOnboardingTab: FC = () => {
  const theme = useTheme();

  const { teamOnboardingSuggestion, loading } =
    useGetTeamOnboardingSuggestion();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!teamOnboardingSuggestion) {
    return null;
  }

  const TeamOnboardingComponent =
    teamOnboardingComponentMap[
      teamOnboardingSuggestion.suggestion as TeamOnboardingSuggestionType
    ];

  return (
    <View style={styles.root}>
      <HeaderBlock>
        <IconUsers width={20} height={20} color={theme.colors.textPrimary} />
      </HeaderBlock>
      {TeamOnboardingComponent && (
        <TeamOnboardingComponent
          teamOnboardingSuggestion={teamOnboardingSuggestion}
        />
      )}
    </View>
  );
};

export const TeamOnboardingFooter: FC = () => {
  const { teamOnboardingSuggestion } = useGetTeamOnboardingSuggestion();

  const { goNext, completeStep } = useContext(OnboardingContext);

  const onSkip = () => {
    completeStep({
      step: EnumOnboardingStep.TeamOnboarding,
      skip: true,
      extraInfo: {
        suggestion:
          teamOnboardingSuggestionToTrackingEnumMap[
            teamOnboardingSuggestion?.suggestion as TeamOnboardingSuggestionType
          ],
      },
    });
  };

  if (
    [
      TeamOnboardingSuggestionType.INVITE,
      TeamOnboardingSuggestionType.INVITE_SUGGESTION,
    ].includes(
      teamOnboardingSuggestion?.suggestion as TeamOnboardingSuggestionType,
    )
  ) {
    return <TeamOnboardingInviteFooter onSkip={onSkip} />;
  }

  if (
    teamOnboardingSuggestion?.suggestion ===
    TeamOnboardingSuggestionType.REQUEST_TEAMS
  ) {
    return <TeamOnboardingRequestTeamsFooter onSkip={onSkip} />;
  }

  // Invariant
  return <Button onPress={goNext}>Next</Button>;
};

export const useTeamOnboardingStates = () => {
  const [teamRequestedToJoin, setTeamRequestedToJoin] = useState<string | null>(
    null,
  );
  const [teamInvitingEmails, setTeamInvitingEmails] = useState<string[]>([]);
  const [teamInviteSent, setTeamInviteSent] = useState(false);

  return {
    teamRequestedToJoin,
    setTeamRequestedToJoin,
    teamInvitingEmails,
    setTeamInvitingEmails,
    teamInviteSent,
    setTeamInviteSent,
  };
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

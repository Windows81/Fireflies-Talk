import { Button } from "@/components/Button";
import { type TeamOnboardingSuggestion } from "@/graphql";
import { useContext, useMemo, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingContext } from "../Context";
import { TitleHeader } from "../components/HeaderTitle";
import { TeamOnboardingTeam } from "./components/TeamOnboardingTeam";

export const TeamOnboardingRequestTeams: FC<{
  teamOnboardingSuggestion: TeamOnboardingSuggestion;
}> = ({ teamOnboardingSuggestion }) => {
  const teams = useMemo(
    () =>
      [...teamOnboardingSuggestion.teams].sort(
        (a, b) => b.teamSize - a.teamSize,
      ),
    [teamOnboardingSuggestion],
  );

  return (
    <>
      <TitleHeader
        title="We found your team on Fireflies"
        description="Collaborate with your teammates and easily share meetings and transcripts."
      />
      <View style={styles.teamList}>
        {teams.map((team) => (
          <TeamOnboardingTeam key={team.id} team={team} />
        ))}
      </View>
    </>
  );
};

export const TeamOnboardingRequestTeamsFooter: FC<{
  onSkip: () => void;
}> = ({ onSkip }) => {
  const { teamRequestedToJoin, goNext } = useContext(OnboardingContext);
  if (teamRequestedToJoin) {
    return <Button onPress={goNext}>Next</Button>;
  }
  return (
    <Button onPress={onSkip} variant="transparentNeutral">
      I&apos;ll join later
    </Button>
  );
};

const styles = StyleSheet.create({
  teamList: {
    marginTop: 32,
  },
});

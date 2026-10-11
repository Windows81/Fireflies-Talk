import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import {
  EnumOnboardingStep,
  EnumTeamOnboardingSuggestionType,
  useRequestToJoinTeamMutation,
  type TeamSuggested,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { useContext, type FC } from "react";
import { View } from "react-native";
import { OnboardingContext } from "../../Context";

export const TeamOnboardingTeam: FC<{
  team: TeamSuggested;
}> = ({ team }) => {
  const theme = useTheme();
  const featuredTeammates = team.teammates.slice(0, 3);

  const { completeStep, teamRequestedToJoin, setTeamRequestedToJoin } =
    useContext(OnboardingContext);

  const [requestToJoinTeam, { loading }] = useRequestToJoinTeamMutation({
    variables: {
      teamId: team.id,
      source: "mobile-team-onboarding",
    },
    onCompleted() {
      setTeamRequestedToJoin(team.id);
      completeStep({
        step: EnumOnboardingStep.TeamOnboarding,
        skip: false,
        extraInfo: {
          suggestion: EnumTeamOnboardingSuggestionType.RequestTeams,
        },
      });
    },
    onError(err) {
      toast({
        message: err.message,
        type: "error",
      });
    },
  });

  const onJoin = () => {
    requestToJoinTeam();
  };

  const isInactive = !!teamRequestedToJoin && teamRequestedToJoin !== team.id;

  return (
    <View style={[styles.root(theme), isInactive && styles.rootInactive]}>
      <View style={styles.leading}>
        <View style={styles.avatarRow}>
          {featuredTeammates.map((teammate, index) => (
            <Avatar
              key={teammate.id}
              size={24}
              name={teammate.name}
              picture={teammate.profile?.picture}
              shape="square"
              style={[styles.avatar(theme), index > 0 && styles.avatarShifted]}
            />
          ))}
          {team.teamSize > 3 && (
            <View style={[styles.avatarMore(theme), styles.avatarShifted]}>
              <Text color="textMuted" variant="body3Regular">
                {team.teamSize - 3}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.contentRow}>
          <Text variant="title3Weight">{team.name}</Text>
          <Text variant="body2Regular" color="textHint">
            {featuredTeammates.map((teammate) => teammate.name).join(", ")}
            {team.teamSize > 3 && ` and ${team.teamSize - 3} others`}
          </Text>
        </View>
      </View>
      {teamRequestedToJoin === team.id ? (
        <Text variant="body2Regular" color="textBrand">
          Requested
        </Text>
      ) : (
        <Button onPress={onJoin} disabled={loading || !!teamRequestedToJoin}>
          Join
        </Button>
      )}
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.layerDefault,
  }),
  rootInactive: {
    opacity: 0.5,
    pointerEvents: "none",
  },
  leading: {
    gap: 9,
  },
  avatarRow: {
    flexDirection: "row",
  },
  avatarShifted: {
    marginLeft: -4,
  },
  avatar: (theme) => ({
    borderWidth: 2,
    borderColor: theme.colors.layerDefault,
  }),
  avatarMore: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 2,
    borderColor: theme.colors.layerDefault,
    borderRadius: 4,
    height: 24,
    minWidth: 24,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  }),
  contentRow: {
    gap: 2,
  },
});

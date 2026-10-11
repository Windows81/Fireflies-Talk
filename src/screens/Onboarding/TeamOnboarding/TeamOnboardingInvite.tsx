import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import type { TagInputProps } from "@/components/Input";
import { TagInputField } from "@/components/Input";
import { Tag } from "@/components/Tag";
import { toast } from "@/components/Toast";
import {
  TeamOnboardingSuggestionType,
  useGetTeamOnboardingSuggestion,
} from "@/features/onboarding";
import { useTeam } from "@/features/team";
import type { SuggestionPublicProfile } from "@/graphql";
import {
  EnumOnboardingStep,
  GetPublicProfileForInviteDocument,
  useGetPublicProfileForInviteLazyQuery,
  useInviteTeammatesMutation,
  type TeamOnboardingSuggestion,
} from "@/graphql";
import { isEmail } from "@/utils/email";
import { useCallback, useContext, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingContext } from "../Context";
import { TitleHeader } from "../components/HeaderTitle";
import { teamOnboardingSuggestionToTrackingEnumMap } from "../constants";
import { TeamOnboardingInviteSuggestions } from "./components/TeamOnboardingInviteSuggestions";

export const TeamOnboardingInvite: FC<{
  teamOnboardingSuggestion: TeamOnboardingSuggestion;
}> = ({ teamOnboardingSuggestion }) => {
  const { teamInvitingEmails, setTeamInvitingEmails, teamInviteSent } =
    useContext(OnboardingContext);

  const [emailProfileMap, setEmailProfileMap] = useState<
    Record<string, SuggestionPublicProfile>
  >({});

  const [getPublicProfileForInvite] = useGetPublicProfileForInviteLazyQuery({
    onCompleted({ getPublicProfileForInvite }) {
      const email = getPublicProfileForInvite?.email;
      if (!email) return;
      setEmailProfileMap((prev) => ({
        ...prev,
        [email]: getPublicProfileForInvite,
      }));
    },
  });

  const onChangeValue: TagInputProps["onChangeValue"] = useCallback(
    (value, option, action) => {
      if (action === "add") {
        option = option.toLowerCase();
        // if the last value is not a valid email, don't update the tag input state
        if (!isEmail(option)) {
          toast({
            message: `"${option}" is not a valid email`,
            type: "error",
          });
          return false;
        }
        setTeamInvitingEmails((prev) => [...prev, option]);
        // inserting the email but remove later if query to get profile fail
        getPublicProfileForInvite({
          query: GetPublicProfileForInviteDocument,
          variables: {
            email: option,
          },
        }).then(({ error }) => {
          if (error) {
            setTeamInvitingEmails((prev) => prev.filter((e) => e !== option));
            toast({
              message: `Cannot invite "${option}": ${error.message}`,
              type: "error",
            });
          }
        });
      } else {
        setTeamInvitingEmails(value);
      }
    },
    [setTeamInvitingEmails, getPublicProfileForInvite],
  );

  const renderTag = useCallback<NonNullable<TagInputProps["renderTag"]>>(
    ({ children, key, ...props }) => {
      const profile = emailProfileMap[children];
      return (
        <Tag
          icon={
            profile?.picture ? (
              <Avatar
                size={20}
                name={profile.name}
                picture={profile.picture}
                shape="square"
              />
            ) : undefined
          }
          key={key}
          {...props}
        >
          {children}
        </Tag>
      );
    },
    [emailProfileMap],
  );

  return (
    <>
      <TitleHeader
        title="Invite coworkers to your workspace"
        description="Collaborate with your teammates and easily share meetings and transcripts."
      />
      <View style={styles.form}>
        <TagInputField
          label="Invite to collaborate"
          value={teamInvitingEmails}
          onChangeValue={onChangeValue}
          placeholder="Emails, seperate with tab or enter"
          maxTagVisible={4}
          disabled={teamInviteSent}
          autoCapitalize="none"
          autoComplete="email"
          renderTag={renderTag}
        />
      </View>
      {teamOnboardingSuggestion.suggestion ===
        TeamOnboardingSuggestionType.INVITE_SUGGESTION && (
        <TeamOnboardingInviteSuggestions
          emailProfileMap={emailProfileMap}
          setEmailProfileMap={setEmailProfileMap}
        />
      )}
    </>
  );
};

export const TeamOnboardingInviteFooter: FC<{
  onSkip: () => void;
}> = ({ onSkip }) => {
  const { teamOnboardingSuggestion } = useGetTeamOnboardingSuggestion();

  const {
    completeStep,
    goNext,
    teamInvitingEmails,
    teamInviteSent,
    setTeamInviteSent,
  } = useContext(OnboardingContext);

  const { team } = useTeam();

  const [inviteTeammates, { loading }] = useInviteTeammatesMutation({
    onCompleted(data) {
      if (data.inviteTeammates !== "Invitations sent!") {
        toast({ message: data.inviteTeammates });
      }
      setTeamInviteSent(true);
      completeStep({
        step: EnumOnboardingStep.TeamOnboarding,
        skip: false,
        extraInfo: {
          suggestion:
            teamOnboardingSuggestionToTrackingEnumMap[
              teamOnboardingSuggestion?.suggestion as TeamOnboardingSuggestionType
            ],
        },
      });
    },
    onError(err) {
      toast({
        title: "Could not send invite",
        message: err.message,
        type: "error",
      });
    },
    variables: {
      source: "mobile-team-onboarding",
      teamEmails: teamInvitingEmails,
      teamId: team?._id as string,
    },
  });

  const onSendInvite = () => {
    inviteTeammates();
  };

  if (teamInviteSent) {
    return (
      <>
        <Button disabled>Invite sent</Button>
        <Button onPress={goNext} variant="transparentNeutral">
          Continue
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        onPress={onSendInvite}
        disabled={teamInvitingEmails.length === 0 || loading}
      >
        Send invite
      </Button>
      <Button onPress={onSkip} variant="transparentNeutral">
        I&apos;ll invite later
      </Button>
    </>
  );
};

const styles = StyleSheet.create({
  form: {
    marginTop: 48,
  },
});

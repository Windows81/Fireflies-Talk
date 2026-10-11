import { Avatar } from "@/components/Avatar";
import { Checkbox } from "@/components/Checkbox";
import type { SuggestionPublicProfile } from "@/graphql";
import { useGetInviteSuggestionsQuery } from "@/graphql";
import { mapByKey } from "@/utils/object";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useContext, useMemo, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingContext } from "../../Context";

const InviteSuggestionsCheckbox: FC<{
  email: string;
  profile?: SuggestionPublicProfile;
}> = ({ email, profile }) => {
  const { teamInvitingEmails, setTeamInvitingEmails } =
    useContext(OnboardingContext);

  const { teamInviteSent } = useContext(OnboardingContext);

  return (
    <Checkbox
      labelLeft={
        <Avatar
          size={20}
          name={profile?.name || email}
          picture={profile?.picture}
          shape="square"
        />
      }
      label={email}
      value={teamInvitingEmails.includes(email)}
      onValueChange={(value) => {
        if (value) {
          setTeamInvitingEmails([...teamInvitingEmails, email]);
        } else {
          setTeamInvitingEmails(teamInvitingEmails.filter((e) => e !== email));
        }
      }}
      disabled={teamInviteSent}
    />
  );
};

const InviteSuggestionSelectAllCheckbox: FC<{
  allEmails: string[];
}> = ({ allEmails }) => {
  const { teamInvitingEmails, setTeamInvitingEmails } =
    useContext(OnboardingContext);

  const allSelected = useMemo(
    () => allEmails.every((email) => teamInvitingEmails.includes(email)),
    [teamInvitingEmails, allEmails],
  );

  const onToggleAll = useCallback(() => {
    if (allSelected) {
      setTeamInvitingEmails([]);
    } else {
      const newEmails = [...teamInvitingEmails];
      for (const email of allEmails) {
        if (!newEmails.includes(email)) {
          newEmails.push(email);
        }
      }
      setTeamInvitingEmails(newEmails);
    }
  }, [allSelected, allEmails, teamInvitingEmails, setTeamInvitingEmails]);

  const { teamInviteSent } = useContext(OnboardingContext);

  return (
    <Checkbox
      style={styles.selectAll}
      label={`Your teammates already using Fireflies (${allEmails.length})`}
      value={allSelected}
      onValueChange={onToggleAll}
      disabled={teamInviteSent}
    />
  );
};

export const TeamOnboardingInviteSuggestions: FC<{
  emailProfileMap: Record<string, SuggestionPublicProfile>;
  setEmailProfileMap: Dispatch<
    SetStateAction<Record<string, SuggestionPublicProfile>>
  >;
}> = ({ emailProfileMap, setEmailProfileMap }) => {
  const { data } = useGetInviteSuggestionsQuery({
    onCompleted({ inviteSuggestions }) {
      const users = inviteSuggestions.users?.items;
      if (!users) return;
      setEmailProfileMap((prev) => {
        const newEmailProfileMap = {
          ...prev,
          ...mapByKey(users, "email"),
        };
        return newEmailProfileMap;
      });
    },
  });
  const allEmails = useMemo(
    () => [
      ...(data?.inviteSuggestions.users?.emails || []),
      ...(data?.inviteSuggestions.nonUsers?.emails || []),
    ],
    [data?.inviteSuggestions],
  );

  const allEmailsCheckboxes = useMemo(
    () =>
      allEmails.map((email) => (
        <InviteSuggestionsCheckbox
          key={email}
          email={email}
          profile={emailProfileMap[email]}
        />
      )),
    [allEmails, emailProfileMap],
  );

  if (!allEmails.length) return null;

  return (
    <View style={styles.suggestList}>
      <InviteSuggestionSelectAllCheckbox allEmails={allEmails} />
      {allEmailsCheckboxes}
    </View>
  );
};

const styles = StyleSheet.create({
  suggestList: {
    marginTop: 24,
  },
  selectAll: {
    marginBottom: 4,
  },
});

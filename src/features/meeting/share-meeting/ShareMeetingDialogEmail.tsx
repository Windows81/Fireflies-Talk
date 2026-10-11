import { LoadingScreen } from "@/components/Loading";
import { PersonGroupListItem, PersonListItem } from "@/components/Person";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import { useTeam } from "@/features/team";
import type {
  FindUsersMeetingIsSharedWithResponse,
  SharedUser,
} from "@/graphql";
import {
  FindUsersMeetingIsSharedWithDocument,
  MeetingNotesPrivacy,
  useCancelSharedMeetingAccessMutation,
  type Meeting,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { useCallback, useMemo, type FC } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { MEETING_PRIVACY_ICON_MAP } from "../constants/privacy";
import { useMeetingCapabilities } from "../utils/permissions";
import { sharedStyles } from "./styles";
import type { SharedGroup, UserGroupFromTeam } from "./types";

const ShareMeetingPersonListItem: FC<{
  sharedUser: SharedUser | SharedGroup;
  meeting: Meeting;
  canEditPrivacy: boolean;
}> = ({ sharedUser, meeting, canEditPrivacy }) => {
  const [cancelSharedMeetingAccess, { loading }] =
    useCancelSharedMeetingAccessMutation({
      refetchQueries: [FindUsersMeetingIsSharedWithDocument],
      onError(err) {
        toast({
          title: "Could not remove access",
          message: err.message,
          type: "error",
        });
      },
    });

  const removeAccess = useCallback(
    (sharedUser: SharedUser | SharedGroup) => {
      if (!sharedUser.sharedMeetingId) return;
      cancelSharedMeetingAccess({
        variables: {
          meetingId: meeting.id,
          sharedMeetingId: sharedUser.sharedMeetingId,
          reason: Config.NAME,
        },
        onCompleted() {
          toast({
            message: `${sharedUser.email} removed from access`,
          });
        },
      });
    },
    [meeting.id, cancelSharedMeetingAccess],
  );

  return (
    <PersonListItem
      {...sharedUser}
      remove={
        canEditPrivacy && sharedUser.sharedMeetingId
          ? {
              label: `Remove access`,
              onPress: () => removeAccess(sharedUser),
              loading,
            }
          : undefined
      }
    />
  );
};

export const ShareMeetingDialogEmail: FC<{
  meeting: Meeting;
  setIsOpenAdd: (isOpen: boolean) => void;
  findUsersMeetingIsSharedWith:
    | FindUsersMeetingIsSharedWithResponse
    | undefined
    | null;
  loading?: boolean;
}> = ({ setIsOpenAdd, meeting, findUsersMeetingIsSharedWith, loading }) => {
  const theme = useTheme();
  const { team, userGroups } = useTeam();

  const teammates = findUsersMeetingIsSharedWith?.teammates;
  const nonTeammates = findUsersMeetingIsSharedWith?.nonTeammates;

  // Separate groups from individual users
  const processSharedUser = (
    user: SharedUser,
    userGroups: UserGroupFromTeam[] | undefined | null,
  ): { isGroup: boolean; processedUser: SharedUser | SharedGroup } => {
    const isGroup = userGroups?.some((group) => group._id === user.email);
    if (isGroup) {
      const group = userGroups?.find((g) => g._id === user.email);
      return {
        isGroup: true,
        processedUser: {
          ...user,
          name: group?.name || user.name,
          email: group?.name || user.email,
          isGroup: true,
        },
      };
    }
    return { isGroup: false, processedUser: user };
  };

  const { individualTeammates, groupTeammates, individualNonTeammates } =
    useMemo(() => {
      const individual: SharedUser[] = [];
      const groups: SharedGroup[] = [];
      const nonTeammateIndividuals: SharedUser[] = [];

      // Process teammates
      teammates?.forEach((teammate) => {
        if (teammate) {
          const { isGroup, processedUser } = processSharedUser(
            teammate,
            userGroups,
          );
          if (isGroup) {
            groups.push(processedUser as SharedGroup);
          } else {
            individual.push(processedUser as SharedUser);
          }
        }
      });

      // Process nonTeammates - move groups to teammates section, keep individuals in nonTeammates
      nonTeammates?.forEach((nonTeammate) => {
        if (nonTeammate) {
          const { isGroup, processedUser } = processSharedUser(
            nonTeammate,
            userGroups,
          );
          if (isGroup) {
            groups.push(processedUser as SharedGroup);
          } else {
            nonTeammateIndividuals.push(processedUser as SharedUser);
          }
        }
      });

      return {
        individualTeammates: individual,
        groupTeammates: groups,
        individualNonTeammates: nonTeammateIndividuals,
      };
    }, [teammates, nonTeammates, userGroups]);

  const isTeammatesPrivacy = [
    MeetingNotesPrivacy.Teammates,
    MeetingNotesPrivacy.Teammatesandparticipants,
  ].includes(meeting.notesPrivacy);
  const isParticipantsPrivacy = [
    MeetingNotesPrivacy.Participants,
    MeetingNotesPrivacy.Teammatesandparticipants,
  ].includes(meeting.notesPrivacy);

  const isOrganizerFromSameTeam = !!team?.teammates?.some(
    (teammate) => teammate?.email === meeting.organizerEmail,
  );

  const { canEditPrivacy } = useMeetingCapabilities(meeting);

  return (
    <View style={styles.root}>
      {loading && !findUsersMeetingIsSharedWith ? (
        <LoadingScreen />
      ) : (
        <>
          {canEditPrivacy && (
            <View style={styles.content}>
              <Pressable
                style={styles.fakeInput(theme)}
                onPress={() => setIsOpenAdd(true)}
              >
                <Text color="textMuted" variant="body2Regular">
                  Add emails or people
                </Text>
              </Pressable>
            </View>
          )}
          <ScrollView contentContainerStyle={sharedStyles.tabContent}>
            {(!!individualTeammates?.length ||
              !!groupTeammates?.length ||
              isTeammatesPrivacy ||
              isParticipantsPrivacy) && (
              <View style={styles.section}>
                <Text
                  color="textMuted"
                  variant="body2Regular"
                  style={styles.sectionTitle}
                >
                  Teammates with access
                </Text>
                {isTeammatesPrivacy && (
                  <PersonGroupListItem
                    Icon={
                      MEETING_PRIVACY_ICON_MAP[MeetingNotesPrivacy.Teammates]
                    }
                    title={
                      isOrganizerFromSameTeam
                        ? "Your team"
                        : `${meeting.organizer?.name || "Organizer"}'s Team`
                    }
                    description={
                      isOrganizerFromSameTeam
                        ? `${team?.teammates?.length || 0} members`
                        : undefined
                    }
                  />
                )}
                {isParticipantsPrivacy && (
                  <PersonGroupListItem
                    Icon={
                      MEETING_PRIVACY_ICON_MAP[MeetingNotesPrivacy.Participants]
                    }
                    title="Participants"
                    description={`${meeting.allEmails?.length || 0} people`}
                  />
                )}
                {/* Show groups first */}
                {groupTeammates?.map(
                  (group) =>
                    !!group && (
                      <ShareMeetingPersonListItem
                        sharedUser={group}
                        meeting={meeting}
                        key={group.sharedMeetingId || group.email}
                        canEditPrivacy={canEditPrivacy}
                      />
                    ),
                )}
                {/* Then show individual teammates */}
                {individualTeammates?.map(
                  (teammate) =>
                    !!teammate && (
                      <ShareMeetingPersonListItem
                        sharedUser={teammate}
                        meeting={meeting}
                        key={teammate.sharedMeetingId || teammate.email}
                        canEditPrivacy={canEditPrivacy}
                      />
                    ),
                )}
              </View>
            )}
            {!!individualNonTeammates?.length && (
              <View style={styles.section}>
                <Text
                  color="textMuted"
                  variant="body2Regular"
                  style={styles.sectionTitle}
                >
                  Others with access
                </Text>
                {individualNonTeammates.map(
                  (nonTeammate) =>
                    !!nonTeammate && (
                      <ShareMeetingPersonListItem
                        sharedUser={nonTeammate}
                        meeting={meeting}
                        key={nonTeammate.sharedMeetingId || nonTeammate.email}
                        canEditPrivacy={canEditPrivacy}
                      />
                    ),
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    paddingVertical: 16,
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  fakeInput: (theme) => ({
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
  }),
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
});

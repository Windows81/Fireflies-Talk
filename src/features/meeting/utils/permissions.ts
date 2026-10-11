import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import {
  useFeatureIsOn,
  useFeatureValue,
  FEATURE_FLAGS,
} from "@/features/feature-flags";
import { useMemo } from "react";
import { getMeetingPrivacyOptions } from "./meeting-privacy-options";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";

// Privacy types that can be deleted by admin (matching dashboard-ff)
const privacyDeletableByAdmin = [
  MeetingNotesPrivacy.Link,
  MeetingNotesPrivacy.Teammatesandparticipants,
  MeetingNotesPrivacy.Teammates,
];

const isParticipant = (meeting: Meeting, userEmail: string): boolean => {
  if (!meeting.allEmails?.length || !userEmail) return false;
  const userEmailLower = userEmail.toLowerCase();
  return meeting.allEmails.some((e) => e?.toLowerCase() === userEmailLower);
};

// TODO: Ideally this should be exposed by the GraphQL server
export const useMeetingCapabilities = (meeting: Meeting) => {
  const { user } = useAuth();
  const { team, isAdmin } = useTeam();

  if (!user) {
    return {
      canEditPrivacy: false,
      canEditMetadata: false,
      canDelete: false,
      canUpload: false,
    };
  }

  const isOwner =
    user.id === meeting.owner || meeting.organizerEmail === user.email;

  // Check if the meeting owner/organizer is a member of the current user's team
  const meetingOwnerIsTeamMember =
    team?.teammates?.some(
      (member) =>
        member?.id === meeting.owner ||
        member?.email === meeting.organizerEmail,
    ) ?? false;

  // User is admin in the owner's team if they are admin AND the meeting owner is in their team
  const isAdminInOwnerTeam = isAdmin && meetingOwnerIsTeamMember;

  const userIsParticipant = isParticipant(meeting, user.email);

  // hasFullMeetingRights logic from dashboard-ff
  const hasFullMeetingRights = (() => {
    if (isOwner) return true;

    if (isAdminInOwnerTeam) {
      if (
        meeting.notesPrivacy === MeetingNotesPrivacy.Participants &&
        userIsParticipant
      ) {
        return true;
      }
      return privacyDeletableByAdmin.includes(meeting.notesPrivacy);
    }

    return false;
  })();

  const canEditMetadata = hasFullMeetingRights;
  const canDelete = hasFullMeetingRights;
  const canEditPrivacy = isOwner || isAdminInOwnerTeam;

  return {
    canEditMetadata,
    canDelete,
    canEditPrivacy,
  };
};

export const useMeetingPrivacyOptions = () => {
  const { team } = useTeam();
  const isParticipatingTeammatesEnabled = useFeatureIsOn(
    FEATURE_FLAGS.DASHBOARD_PARTICIPATING_TEAMMATES_PRIVACY,
  );
  const customPrivacyPrivilegesEnabled = useFeatureIsOn(
    FEATURE_FLAGS.USER_HAS_CUSTOM_PRIVACY_PRIVILEGES,
  );
  const customPrivacyPrecedence = useFeatureValue(
    FEATURE_FLAGS.CUSTOM_PRIVACY_PRECEDENCE,
    null,
  );
  const restrictPrivacies = useFeatureValue<Record<string, string> | null>(
    FEATURE_FLAGS.RESTRICT_PRIVACIES,
    null,
  );

  const privacyOptions = useMemo(
    () =>
      getMeetingPrivacyOptions({
        customPrivacyPrivilegesEnabled,
        teamPrivacy: team?.settings?.privacy,
        customPrivacyPrecedence,
        restrictedPrivacies: restrictPrivacies,
        participatingTeammatesEnabled: isParticipatingTeammatesEnabled,
      }),
    [
      customPrivacyPrivilegesEnabled,
      team?.settings?.privacy,
      customPrivacyPrecedence,
      restrictPrivacies,
      isParticipatingTeammatesEnabled,
    ],
  );

  return privacyOptions;
};

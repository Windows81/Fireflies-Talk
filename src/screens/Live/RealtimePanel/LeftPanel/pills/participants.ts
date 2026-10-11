import { type Meeting } from "@/graphql";

export interface ParticipantInfo {
  key: string;
  name: string;
  picture?: string | null;
  // Email to invite to the team; set only for attendees who are not teammates.
  inviteEmail?: string | null;
}

export interface TeamMemberInfo {
  name?: string | null;
  picture?: string | null;
}

/**
 * List the meeting participants. Prefers the calendar attendees (with their
 * display names); when there are none — e.g. a self/instant recording — it falls
 * back to the organizer.
 *
 * When an attendee matches a Fireflies teammate (by email), their account name
 * and picture are used instead of the bare calendar display name/email.
 */
export const getMeetingParticipants = (
  meeting: Meeting,
  teamByEmail?: Map<string, TeamMemberInfo>,
): ParticipantInfo[] => {
  const organizerEmail = meeting.organizerEmail?.toLowerCase();

  const attendees = (meeting.attendees ?? []).filter(
    (attendee) => attendee?.displayName || attendee?.email,
  );

  if (attendees.length > 0) {
    return attendees.map((attendee, index) => {
      const rawEmail = attendee?.email ?? undefined;
      const email = rawEmail?.toLowerCase();
      const member = email ? teamByEmail?.get(email) : undefined;
      const isOrganizer =
        attendee?.organizer === true || (!!email && email === organizerEmail);
      const name =
        member?.name || attendee?.displayName || attendee?.email || "";
      const picture =
        member?.picture ??
        (isOrganizer ? meeting.organizer?.picture : undefined);
      return {
        key: attendee?.id ?? attendee?.email ?? `attendee-${index}`,
        name,
        picture,
        inviteEmail: member ? undefined : rawEmail,
      };
    });
  }

  return [
    {
      key: "organizer",
      name: meeting.organizer?.name || meeting.organizerEmail || "You",
      picture: meeting.organizer?.picture,
    },
  ];
};

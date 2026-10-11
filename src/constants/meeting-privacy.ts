import {
  IconGlobe,
  IconLock,
  IconParticipatingTeammates,
  IconSmartphone,
  IconTeammatesParticipants,
  IconUsers,
} from "@/assets/svg";
import { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";

export const MEETING_PRIVACY_ICON_MAP = {
  [MeetingNotesPrivacy.Link]: IconGlobe,
  [MeetingNotesPrivacy.Teammatesandparticipants]: IconTeammatesParticipants,
  [MeetingNotesPrivacy.Participants]: IconUsers,
  [MeetingNotesPrivacy.Participatingteammates]: IconParticipatingTeammates,
  [MeetingNotesPrivacy.Teammates]: IconSmartphone,
  [MeetingNotesPrivacy.Owner]: IconLock,
};

const OWNER_MEETING_PRIVACY_OPTION = {
  value: MeetingNotesPrivacy.Owner,
  label: "Only owner",
  description: "Only owner can access with the link",
  Icon: MEETING_PRIVACY_ICON_MAP[MeetingNotesPrivacy.Owner],
};

export const MEETING_PRIVACY_OPTIONS = [
  {
    value: MeetingNotesPrivacy.Link,
    label: "Teammates & Anyone with Link",
    description: "Anyone can access with the link",
    Icon: MEETING_PRIVACY_ICON_MAP[MeetingNotesPrivacy.Link],
  },
  {
    value: MeetingNotesPrivacy.Teammatesandparticipants,
    label: "Only Participants & Teammates",
    description: "Teammates and participants can access with the link",
    Icon: MEETING_PRIVACY_ICON_MAP[
      MeetingNotesPrivacy.Teammatesandparticipants
    ],
  },
  {
    value: MeetingNotesPrivacy.Participants,
    label: "Only Participants",
    description: "Only participants can access with the link",
    Icon: MEETING_PRIVACY_ICON_MAP[MeetingNotesPrivacy.Participants],
  },
  {
    value: MeetingNotesPrivacy.Teammates,
    label: "Only Teammates",
    description: "Only teammates can access with the link",
    Icon: MEETING_PRIVACY_ICON_MAP[MeetingNotesPrivacy.Teammates],
  },
  {
    value: MeetingNotesPrivacy.Participatingteammates,
    label: "Only Participants in the Team",
    description: "Only participants who are teammates can access",
    Icon: MEETING_PRIVACY_ICON_MAP[MeetingNotesPrivacy.Participatingteammates],
  },
  OWNER_MEETING_PRIVACY_OPTION,
];

export function getMeetingPrivacyOption(
  value: MeetingNotesPrivacy | undefined,
): (typeof MEETING_PRIVACY_OPTIONS)[number] {
  return (
    MEETING_PRIVACY_OPTIONS.find((option) => option.value === value) ||
    OWNER_MEETING_PRIVACY_OPTION
  );
}

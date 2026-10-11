import {
  IconGlobe,
  IconLock,
  IconSmartphone,
  IconTeammatesParticipants,
  IconUsers,
} from "@/assets/svg";
import { SoundbitePrivacy } from "@firefliesai/bites-ff.graphql-client";

// soundbites privacies is a list of privacy option
// eg. ['team', 'participant'] rather than a single privacy option
// this resolves the array into a single privacy option
// to support to simple privacy UI select options on dashboard-ff with the following options:
// - private
// - team
// - participants
// - teamandparticipants
// - public
export const BITE_SINGLE_MULTIPLE_PRIVACY_MAP: Record<
  string,
  SoundbitePrivacy[]
> = {
  private: [],
  team: [SoundbitePrivacy.Team],
  participants: [SoundbitePrivacy.Participants],
  teamandparticipants: [
    SoundbitePrivacy.Team,
    SoundbitePrivacy.Participants,
  ].sort(),
  public: [SoundbitePrivacy.Public],
};

export const BITE_PRIVACY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Soundbite can be accessed by anyone with link.",
    Icon: IconGlobe,
  },
  {
    value: "teamandparticipants",
    label: "Only Teammates & Participants",
    description: "Soundbite can be accessed by teammates and participants.",
    Icon: IconTeammatesParticipants,
  },
  {
    value: "participants",
    label: "Only Participants",
    description: "Soundbite can be accessed by participants.",
    Icon: IconUsers,
  },
  {
    value: "team",
    label: "Only Teammates",
    description: "Soundbite can be accessed by teammates.",
    Icon: IconSmartphone,
  },
  {
    value: "private",
    label: "Private",
    description: "Soundbite can be accessed by only you.",
    Icon: IconLock,
  },
];

export const getSinglePrivacy = (privacies: SoundbitePrivacy[]) => {
  return (
    Object.entries(BITE_SINGLE_MULTIPLE_PRIVACY_MAP).find(
      ([, v]) => v.toString() === (privacies || []).toString(),
    )?.[0] || "private"
  );
};

export const fromSinglePrivacy = (privacy: string) => {
  return BITE_SINGLE_MULTIPLE_PRIVACY_MAP[
    privacy as keyof typeof BITE_SINGLE_MULTIPLE_PRIVACY_MAP
  ];
};

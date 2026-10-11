import { PlaylistPrivacy } from "@firefliesai/bites-ff.graphql-client";

export const PLAYLIST_PRIVACY_OPTIONS = [
  {
    value: PlaylistPrivacy.Public,
    label: "Public",
    description: "Playlist can be accessed by anyone with link.",
  },
  {
    value: PlaylistPrivacy.Team,
    label: "Team",
    description: "Playlist can be accessed by teammates.",
  },
  {
    value: PlaylistPrivacy.Private,
    label: "Private",
    description: "Playlist can be accessed by only you.",
  },
];

import type { Channel } from "@/graphql";

export const LOCAL_CHANNEL_NAMES = {
  all: "All Meetings",
  mine: "My Meetings",
  shared: "Shared With Me",
} as const;

export const LOCAL_CHANNELS: Channel[] = [
  {
    title: LOCAL_CHANNEL_NAMES.all,
    _id: "all",
  },
  {
    title: LOCAL_CHANNEL_NAMES.mine,
    _id: "mine",
  },
  {
    title: LOCAL_CHANNEL_NAMES.shared,
    _id: "shared",
  },
];

export type DesktopHomeChannelId =
  | "mine-shared"
  | "mine"
  | "shared"
  | "autopilot";

export const DESKTOP_HOME_CHANNELS: {
  id: DesktopHomeChannelId;
  label: string;
}[] = [
  { id: "mine-shared", label: "My meetings" },
  { id: "mine", label: "Hosted by me" },
  { id: "shared", label: "Shared with me" },
];

/** Shared autopilot tab metadata for desktop home and feature gating. */
export const AUTOPILOT_HOME_CHANNEL = {
  id: "autopilot" as const,
  label: "Voice Agent Meetings",
};

export const DESKTOP_HOME_VOICE_AGENT_CHANNEL = AUTOPILOT_HOME_CHANNEL;

export const DEFAULT_DESKTOP_HOME_CHANNEL_ID: DesktopHomeChannelId =
  "mine-shared";

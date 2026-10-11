const API_CHANNEL_ID_MAP: Record<string, string> = {
  "mine-shared": "USER_PART_OF",
  mine: "mine",
  all: "all",
  shared: "shared",
  autopilot: "autopilot",
};

export const getActualApiChannelId = (channelId: string): string =>
  API_CHANNEL_ID_MAP[channelId] ?? channelId ?? "all";

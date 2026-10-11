import { useMemo } from "react";
import { useGetAutopilotEnabled } from "@/hooks/useGetAutopilotEnabled";
import {
  DESKTOP_HOME_CHANNELS,
  DESKTOP_HOME_VOICE_AGENT_CHANNEL,
  type DesktopHomeChannelId,
} from "./constants";

export const useDesktopHomeChannels = (): {
  id: DesktopHomeChannelId;
  label: string;
}[] => {
  const { isAutopilotEnabled } = useGetAutopilotEnabled();

  return useMemo(() => {
    if (!isAutopilotEnabled) return DESKTOP_HOME_CHANNELS;
    return [...DESKTOP_HOME_CHANNELS, DESKTOP_HOME_VOICE_AGENT_CHANNEL];
  }, [isAutopilotEnabled]);
};

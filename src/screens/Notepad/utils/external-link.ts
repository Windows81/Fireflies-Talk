import { Config } from "@/constants";
import { usePlayer } from "@/features/player";
import type { Meeting } from "@/graphql";
import { toSecFromHHMMSS } from "@/utils/time";
import { useCallback } from "react";
import { Linking } from "react-native";

// Intercept some links that refer to the current meeting
// needs return false to prevent the default action
export const useExternalLinkHandler = (meeting: Meeting) => {
  const { player } = usePlayer();

  return useCallback(
    (urlStr: string): boolean => {
      const url = new URL(urlStr, Config.DASHBOARD_URL);

      if (url.pathname === `/view/${meeting.id}`) {
        // originates from an action to navigate to a specific time
        const tParam = url.searchParams.get("t");
        if (tParam) {
          const tVal = toSecFromHHMMSS(tParam);
          if (player) {
            player.currentTime = tVal;
            player.play();
          }
          return false;
        }
      }

      // default action
      Linking.openURL(urlStr);
      return false;
    },
    [meeting, player],
  );
};

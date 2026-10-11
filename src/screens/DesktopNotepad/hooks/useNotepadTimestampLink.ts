import { Config } from "@/constants";
import { usePlayer } from "@/features/player";
import { toSecFromHHMMSS } from "@/utils/time";
import { useCallback } from "react";
import { Linking } from "react-native";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";
import { hasPlayableMedia } from "../helpers/meeting";

/**
 * Jumps a summary timestamp to the transcript: reveals the transcript tab and
 * scrolls to that moment, and plays from that point when media is available.
 */
export const useNotepadTimestampNavigation = () => {
  const { meeting, requestTranscriptSeek } = useDesktopNotepadContext();
  const { player } = usePlayer();
  const mediaEnabled = hasPlayableMedia(meeting);

  return useCallback(
    (seconds: number) => {
      if (Number.isNaN(seconds)) return;
      requestTranscriptSeek(seconds);
      if (mediaEnabled && player) {
        player.currentTime = seconds;
        player.play();
      }
    },
    [requestTranscriptSeek, mediaEnabled, player],
  );
};

/**
 * Markdown `onLinkPress` for notepad summaries: intercepts the meeting's own
 * "?t=" timestamp links to navigate the transcript, and opens any other link.
 */
export const useNotepadTimestampLink = (meetingId: string) => {
  const navigate = useNotepadTimestampNavigation();

  return useCallback(
    (urlStr: string): boolean => {
      try {
        const url = new URL(urlStr, Config.DASHBOARD_URL);
        if (url.pathname === `/view/${meetingId}`) {
          const t = url.searchParams.get("t");
          if (t) {
            navigate(toSecFromHHMMSS(t));
            return false;
          }
        }
      } catch {
        // Malformed URL — fall through and let Linking handle it.
      }
      Linking.openURL(urlStr).catch(() => {});
      return false;
    },
    [meetingId, navigate],
  );
};

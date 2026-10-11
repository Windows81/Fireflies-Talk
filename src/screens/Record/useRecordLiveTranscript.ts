import { useCallback, useEffect, useRef } from "react";
import { apolloClient } from "@/graphql";
import type { LiveTranscriptItem } from "@/graphql";
import type { GroupedCaption } from "@/components/Transcript";
import { LiveMeetingEvents } from "@/features/live";
import { ASSIST_MODES } from "@/features/live/types";
import { useLiveMeetingSocket } from "@/screens/Live/Context/useLiveMeetingSocket";
import { useLiveTranscript } from "@/screens/Live/Context/useLiveTranscript";
import { useMeetingLivenessFallback } from "@/screens/Live/Context/useMeetingLivenessFallback";

// Stable reference — useLiveMeetingSocket keys its connection effect on it.
const NO_KNOWLEDGE_BASES: string[] = [];

/**
 * Live transcript stream for a meeting: connects the realtime transcription
 * socket for `meetingId` and accumulates broadcast captions. Pass an empty
 * `meetingId` to stay disconnected.
 *
 * `onMeetingEnded` (live bot meetings) fires on the ended broadcast, with a
 * liveness probe as safety net: after 30s of transcript silence the server is
 * asked whether the meeting is still live. Pass a stable callback — it keys
 * the probe's interval effect.
 */
export const useRecordLiveTranscript = ({
  meetingId,
  isLive,
  onMeetingEnded,
}: {
  meetingId: string;
  isLive: boolean;
  onMeetingEnded?: () => void;
}): { groupedCaptions: GroupedCaption[]; loading: boolean } => {
  const { socket, realtimeToken, setLastActivityTime } = useLiveMeetingSocket({
    apolloClient,
    meetingId,
    assistMode: ASSIST_MODES.GENERAL,
    knowledgeBases: NO_KNOWLEDGE_BASES,
    isLive,
    receivesTranscriptsOverSocket: true,
  });

  const { liveTranscript, ingestTranscript } = useLiveTranscript({
    meetingId,
    realtimeToken,
  });

  const lastTranscriptTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!socket) return;

    const onLiveTranscriptBroadcast = (data: LiveTranscriptItem) => {
      setLastActivityTime();
      lastTranscriptTimeRef.current = Date.now();
      ingestTranscript(data);
    };
    socket.on(
      LiveMeetingEvents.LIVE_TRANSCRIPT_BROADCAST_EVENT,
      onLiveTranscriptBroadcast,
    );
    return () => {
      socket.off(
        LiveMeetingEvents.LIVE_TRANSCRIPT_BROADCAST_EVENT,
        onLiveTranscriptBroadcast,
      );
    };
  }, [socket, ingestTranscript, setLastActivityTime]);

  useEffect(() => {
    if (!socket || !onMeetingEnded) return;

    socket.on(LiveMeetingEvents.MEETING_ENDED_BROADCAST, onMeetingEnded);
    return () => {
      socket.off(LiveMeetingEvents.MEETING_ENDED_BROADCAST, onMeetingEnded);
    };
  }, [socket, onMeetingEnded]);

  const isDiscardingRef = useRef(false); // viewer never discards
  const onSessionOver = useCallback(async () => {
    onMeetingEnded?.();
  }, [onMeetingEnded]);
  useMeetingLivenessFallback({
    apolloClient,
    meetingId,
    // Without an ended callback there is nothing to probe for.
    isMeetingEnded: !onMeetingEnded || !isLive,
    isDiscardingRef,
    lastRealtimeTranscriptTimeRef: lastTranscriptTimeRef,
    onSessionOver,
  });

  return {
    groupedCaptions: liveTranscript.groupedCaptions,
    loading: liveTranscript.loading,
  };
};

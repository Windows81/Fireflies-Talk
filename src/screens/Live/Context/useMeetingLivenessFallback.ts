import type { MutableRefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { ApolloClient } from "@apollo/client";
import { GetMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import {
  isLiveSessionOver,
  shouldProbeMeetingLiveness,
  type LivenessProbe,
} from "@/features/live";
import { Logger } from "@/logger";

const logger = new Logger("useMeetingLivenessFallback");

const INACTIVITY_CHECK_MS = 30_000;
// Covers the end animation plus the end-of-session work that follows it.
const END_FLOW_GRACE_MS = 10_000;

interface MeetingLivenessFallbackOptions {
  apolloClient: ApolloClient<unknown>;
  meetingId: string;
  isMeetingEnded: boolean;
  isDiscardingRef: MutableRefObject<boolean>;
  lastRealtimeTranscriptTimeRef: MutableRefObject<number>;
  onSessionOver: () => Promise<void>;
}

/**
 * Realtime transcripts are what tell the live window a meeting is still running,
 * and the meeting-ended socket event can be missed. After 30s of silence this
 * asks the server directly and ends the session once the meeting is gone or no
 * longer live, so the window stops polling a meeting that can never answer again.
 *
 * Silence is counted from the last transcript or, when none ever arrived, from
 * mount: desktop recordings stream transcripts over Electron IPC to the recorder
 * and the live view only, so a live screen in any other renderer never receives
 * one and must still be able to discover that its meeting has ended.
 */
export const useMeetingLivenessFallback = ({
  apolloClient,
  meetingId,
  isMeetingEnded,
  isDiscardingRef,
  lastRealtimeTranscriptTimeRef,
  onSessionOver,
}: MeetingLivenessFallbackOptions) => {
  const probeMeetingLiveness = useCallback(async (): Promise<LivenessProbe> => {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetMeetingDocument,
        variables: { id: meetingId },
        // Writing the answer straight to the cache would publish an empty meeting
        // to the live screen and unmount it mid-probe, so the write is done below
        // only when the server returned a meeting.
        fetchPolicy: "no-cache",
        // The probe has to read what the server answered: a rejected query can't
        // tell a meeting the server lost apart from an unreachable backend.
        errorPolicy: "all",
      });

      // Keep the cached status fresh for the screens watching this meeting.
      if (data?.meeting) {
        apolloClient.writeQuery({
          query: GetMeetingDocument,
          variables: { id: meetingId },
          data,
        });
      }

      return { data, errors };
    } catch (error) {
      return { networkError: error };
    }
  }, [apolloClient, meetingId]);

  // 0 while no live session is watched, otherwise the id of the current watch.
  // A probe that resolves after the session ended, the screen unmounted or the
  // meeting changed must not end the wrong session.
  const watchIdRef = useRef(0);
  const nextWatchIdRef = useRef(0);
  // Watch whose check (probe or end flow) is in flight; one per watch at a time.
  const checkingWatchIdRef = useRef(0);
  // When the end flow was last handed off, per watch. The end animation runs
  // before the session is marked ended, so no second flow starts meanwhile; a
  // flow the animation store dropped is retried once the grace period passes.
  const endRequestedRef = useRef({ watchId: 0, at: 0 });

  const checkSessionOver = useCallback(
    async (watchId: number, trigger: string) => {
      const probe = await probeMeetingLiveness();

      const isStale = watchIdRef.current !== watchId || isDiscardingRef.current;
      if (isStale) return;

      if (!isLiveSessionOver(probe)) {
        logger.info(`${trigger}: meeting is still live`, {
          meetingId,
          failed: Boolean(probe.networkError || probe.errors?.length),
        });

        return;
      }

      logger.info(`${trigger}: live session is over, ending it`, {
        meetingId,
        meetingMissing: !probe.data?.meeting,
      });

      // Two callers (the inactivity check and a rejected socket) can probe at
      // once, and onSessionOver returns before the end transition finishes, so
      // claim the end here or the other probe ends the session a second time.
      endRequestedRef.current = { watchId, at: Date.now() };
      try {
        await onSessionOver();
      } catch (error) {
        logger.error(`${trigger}: failed to end the live session`, {
          meetingId,
          error,
        });
      }
    },
    [meetingId, probeMeetingLiveness, onSessionOver, isDiscardingRef],
  );

  /**
   * Asks the server whether the meeting is still live and ends the session if
   * it is not. `trigger` names the caller in the logs. Discard owns its own
   * teardown. Watching continues until `isMeetingEnded` flips.
   */
  const endSessionIfOver = useCallback(
    async (trigger: string) => {
      const watchId = watchIdRef.current;
      const endRequested = endRequestedRef.current;
      const isEndFlowPending =
        endRequested.watchId === watchId &&
        Date.now() - endRequested.at < END_FLOW_GRACE_MS;
      const isBusy =
        !watchId ||
        checkingWatchIdRef.current === watchId ||
        isEndFlowPending ||
        isDiscardingRef.current;
      if (isBusy) return;

      checkingWatchIdRef.current = watchId;
      try {
        await checkSessionOver(watchId, trigger);
      } finally {
        if (checkingWatchIdRef.current === watchId)
          checkingWatchIdRef.current = 0;
      }
    },
    [checkSessionOver, isDiscardingRef],
  );

  useEffect(() => {
    if (isMeetingEnded) return;

    const watchId = ++nextWatchIdRef.current;
    watchIdRef.current = watchId;

    const intervalId = setInterval(async () => {
      const shouldProbe = shouldProbeMeetingLiveness({
        isDiscarding: isDiscardingRef.current,
        msSinceLastSignal: Date.now() - lastRealtimeTranscriptTimeRef.current,
        idleThresholdMs: INACTIVITY_CHECK_MS,
      });
      if (!shouldProbe) return;

      // Reset timer so we don't fire again for another 30s
      lastRealtimeTranscriptTimeRef.current = Date.now();

      await endSessionIfOver("Inactivity fallback");
    }, INACTIVITY_CHECK_MS);

    return () => {
      if (watchIdRef.current === watchId) watchIdRef.current = 0;
      clearInterval(intervalId);
    };
  }, [
    isMeetingEnded,
    endSessionIfOver,
    isDiscardingRef,
    lastRealtimeTranscriptTimeRef,
  ]);

  return { endSessionIfOver };
};

import {
  GetFeedMeetingByIdDocument,
  MeetingSummaryStatus,
  useFetchSummaryStatusLazyQuery,
} from "@/graphql";
import { useApolloClient } from "@apollo/client";
import {
  GetMeetingDocument,
  GetMeetingSummaryQueryDocument,
} from "@firefliesai/mobile-ff.graphql-client";
import type { DocumentNode } from "graphql";
import { useCallback, useEffect, useRef } from "react";
import { useSummaryProcessingStore } from "./useSummaryProcessingStore";

const POLL_INTERVAL_MS = 15000;
const PROCESSING_WATCH_DURATION_MS = 60_000;

interface Options {
  refetchDocuments?: DocumentNode[];
  onSettled?: () => void;
  detectOnMount?: boolean;
  /** After a live/RTP redirect, poll until summary enters Processing. */
  watchForProcessing?: boolean;
}

interface StartOptions {
  /** Caller already acquired a processing slot for this job. */
  processingHeld?: boolean;
}

/**
 * Tracks whether the meeting summary is (re)processing and drives the polling
 * that swaps in the fresh summary once it settles.
 */
export function useSummaryProcessing(meetingId: string, options: Options = {}) {
  const client = useApolloClient();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const processing = useSummaryProcessingStore(
    (state) => countForMeeting(state.jobCounts, meetingId) > 0,
  );
  const acquire = useSummaryProcessingStore((state) => state.acquire);
  const release = useSummaryProcessingStore((state) => state.release);

  const [fetchStatus] = useFetchSummaryStatusLazyQuery({
    variables: { meetingId },
    fetchPolicy: "network-only",
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const activeRef = useRef(false);
  const heldRef = useRef(false);

  const acquireSlot = useCallback(() => {
    if (heldRef.current) return;
    heldRef.current = true;
    acquire(meetingId);
  }, [acquire, meetingId]);

  const releaseSlot = useCallback(() => {
    if (!heldRef.current) return;
    heldRef.current = false;
    release(meetingId);
  }, [meetingId, release]);

  const stopPolling = useCallback(() => {
    activeRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const stop = useCallback(() => {
    stopPolling();
    releaseSlot();
  }, [releaseSlot, stopPolling]);

  const settle = useCallback(() => {
    stopPolling();
    releaseSlot();
    void client.refetchQueries({
      include: [
        GetMeetingDocument,
        GetMeetingSummaryQueryDocument,
        GetFeedMeetingByIdDocument,
        ...(optionsRef.current.refetchDocuments ?? []),
      ],
    });
    optionsRef.current.onSettled?.();
  }, [client, releaseSlot, stopPolling]);

  const tick = useCallback(() => {
    fetchStatus()
      .then(({ data }) => {
        if (!activeRef.current) return;
        if (data?.fetchSummaryStatus === MeetingSummaryStatus.Processing) {
          timeoutRef.current = setTimeout(tick, POLL_INTERVAL_MS);
          return;
        }
        settle();
      })
      .catch(() => {
        // Transient failure: keep polling while still active.
        if (activeRef.current) {
          timeoutRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      });
  }, [fetchStatus, settle]);

  const start = useCallback(
    (startOptions?: StartOptions) => {
      if (activeRef.current) return;
      activeRef.current = true;
      if (!startOptions?.processingHeld) {
        acquireSlot();
      }
      tick();
    },
    [acquireSlot, tick],
  );

  useEffect(() => stop, [stop]);

  useEffect(() => {
    const shouldDetect = optionsRef.current.detectOnMount;
    const shouldWatch = optionsRef.current.watchForProcessing;
    if (!shouldDetect && !shouldWatch) return;

    let cancelled = false;
    let watchTimeout: ReturnType<typeof setTimeout> | undefined;
    const watchStartedAt = Date.now();

    const handleProcessingStatus = (
      status: MeetingSummaryStatus | null | undefined,
    ) => {
      if (status !== MeetingSummaryStatus.Processing) return false;
      start();
      return true;
    };

    const scheduleWatch = () => {
      if (cancelled || !shouldWatch) return;
      if (Date.now() - watchStartedAt >= PROCESSING_WATCH_DURATION_MS) return;

      watchTimeout = setTimeout(() => {
        void fetchStatus()
          .then(({ data }) => {
            if (cancelled) return;
            if (handleProcessingStatus(data?.fetchSummaryStatus)) return;
            scheduleWatch();
          })
          .catch(() => {
            if (!cancelled) scheduleWatch();
          });
      }, POLL_INTERVAL_MS);
    };

    void fetchStatus()
      .then(({ data }) => {
        if (cancelled) return;
        if (handleProcessingStatus(data?.fetchSummaryStatus)) return;
        if (shouldWatch) scheduleWatch();
      })
      .catch(() => {
        if (!cancelled && shouldWatch) scheduleWatch();
      });

    return () => {
      cancelled = true;
      if (watchTimeout) clearTimeout(watchTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  return {
    processing,
    start,
    stop,
    acquireProcessing: acquireSlot,
    releaseProcessing: releaseSlot,
  };
}

const countForMeeting = (counts: Record<string, number>, meetingId: string) =>
  counts[meetingId] ?? 0;

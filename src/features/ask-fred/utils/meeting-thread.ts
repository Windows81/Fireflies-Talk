import type { Thread } from "@firefliesai/fred-client";

export const LIVE_HEARTBEAT_THREAD_SOURCE = "puppet-heartbeat";

/** Heartbeat threads are live-Fred's internal loop, not the user's AskFred conversation. */
export function findMeetingAskFredThread(
  threads: Thread[],
  meetingId: string,
): Thread | undefined {
  return threads.find(
    (thread) =>
      thread.meetingId === meetingId &&
      thread.source !== LIVE_HEARTBEAT_THREAD_SOURCE,
  );
}

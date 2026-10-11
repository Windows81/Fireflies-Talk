import { isNotFoundError } from "@/errors";
import { apolloClient } from "@/graphql";
import { Logger } from "@/logger";
import {
  GetMeetingDocument,
  type GetMeetingQuery,
  type GetMeetingQueryVariables,
} from "@firefliesai/mobile-ff.graphql-client";
import {
  activeRecordingStoreApi,
  type ActiveRecording,
} from "./active-recording.store";
import {
  resumeRealtimeMeetingBeforeStop,
  stopRealtimeMeeting,
} from "./puppet-sync";

const logger = new Logger("reconcile-abandoned-recording");

/** Server statuses under which an unstopped recording is still live. */
const LIVE_STATUSES = new Set(["started", "active", "paused"]);

let inflight: Promise<void> | null = null;

/**
 * Ends the recordings left in the store by a crashed/killed process. Single-
 * flight: the startup call and a `start` racing it share one run so the
 * completed stop is never sent twice.
 */
export function reconcileAbandonedRecording(): Promise<void> {
  inflight ??= runReconcile().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function runReconcile(): Promise<void> {
  for (const record of activeRecordingStoreApi.list()) {
    await reconcileOne(record);
  }
}

async function reconcileOne(record: ActiveRecording): Promise<void> {
  try {
    const { data } = await apolloClient.query<
      GetMeetingQuery,
      GetMeetingQueryVariables
    >({
      query: GetMeetingDocument,
      variables: { id: record.meetingId },
      fetchPolicy: "network-only",
    });
    const meeting = data?.meeting;
    if (!meeting || !LIVE_STATUSES.has(meeting.status ?? "")) {
      activeRecordingStoreApi.remove(record.meetingId);
      return;
    }

    if (meeting.status === "paused") {
      await resumeRealtimeMeetingBeforeStop(record.meetingId);
    }

    const stopped = await stopRealtimeMeeting({
      meetingId: record.meetingId,
      duration: record.activeMs,
      completed: true,
    });
    // A stop request that never landed keeps the record for the next launch.
    if (!stopped) return;

    activeRecordingStoreApi.remove(record.meetingId);
    logger.info("reconciled abandoned recording", {
      meetingId: record.meetingId,
    });
  } catch (err) {
    const cause =
      (err as { graphQLErrors?: unknown[] }).graphQLErrors?.[0] ?? err;
    // A deleted meeting can never be finished by this client, so retrying it
    // on every launch would loop forever. A Forbidden error is not terminal:
    // another account may be signed in while the owner can finish the
    // recording on a later launch.
    if (isNotFoundError(cause)) {
      activeRecordingStoreApi.remove(record.meetingId);
      logger.info("dropped unrecoverable abandoned recording", {
        meetingId: record.meetingId,
      });
      return;
    }
    logger.warn("failed to reconcile abandoned recording", {
      err,
      meetingId: record.meetingId,
    });
  }
}

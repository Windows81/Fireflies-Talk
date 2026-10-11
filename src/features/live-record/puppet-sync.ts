import { toast } from "@/components/Toast";
import { captureException, getErrorMessage } from "@/errors";
import {
  UpdateMeetingStateDocument,
  type UpdateMeetingStateMutation,
  type UpdateMeetingStateMutationVariables,
  apolloClient,
} from "@/graphql";
import { Logger } from "@/logger";
import {
  PauseRealtimeMeetingDocument,
  ResumeRealtimeMeetingDocument,
  StopRealtimeMeetingDocument,
} from "@firefliesai/mobile-ff.graphql-client";

const logger = new Logger("puppet-sync");

export type PuppetActionName = "pause_recording" | "resume_recording";

// Mutations exceeding this threshold are flagged as slow in logs.
const SLOW_SYNC_THRESHOLD_MS = 5000;

/**
 * Notify puppet about a recording state change (pause/resume) via the
 * updateMeetingState GraphQL mutation through the gateway.
 * Fire-and-forget: local pause/resume is never blocked by server errors.
 * Network-level retries are handled by Apollo's RetryLink (exponential backoff, max 5 attempts).
 */
export async function syncPuppetAction(
  action: PuppetActionName,
  meetingId: string,
): Promise<void> {
  const startMs = Date.now();
  logger.info(
    `[syncPuppetAction] START action=${action} meetingId=${meetingId}`,
  );

  try {
    const result = await apolloClient.mutate<
      UpdateMeetingStateMutation,
      UpdateMeetingStateMutationVariables
    >({
      mutation: UpdateMeetingStateDocument,
      variables: { meetingId, action },
    });

    const durationMs = Date.now() - startMs;
    logger.info("[syncPuppetAction] response", {
      data: result.data,
      errors: result.errors,
      durationMs,
    });

    if (durationMs > SLOW_SYNC_THRESHOLD_MS) {
      logger.warn(
        `[syncPuppetAction] SLOW: ${action} took ${durationMs}ms for meeting ${meetingId}`,
      );
    }

    if (result.errors?.length) {
      const msgs = result.errors.map((e) => e.message).join(", ");
      throw new Error(msgs);
    }

    if (result.data?.updateMeetingState) {
      logger.info(
        `[syncPuppetAction] SUCCESS: ${action} synced for meeting ${meetingId} in ${durationMs}ms`,
      );
      return;
    }

    throw new Error(`Server returned false for ${action}`);
  } catch (err) {
    const durationMs = Date.now() - startMs;
    logger.error(`Failed to sync puppet ${action}`, {
      err,
      durationMs,
      meetingId,
    });
    captureException(new Error(getErrorMessage(err, `puppet: ${action}`)), {
      tags: {
        section: "puppet-sync",
        action,
      },
      extra: { durationMs, meetingId },
    });

    const actionLabel = action === "pause_recording" ? "pause" : "resume";
    toast({
      message: `Failed to sync ${actionLabel} with server. Your local recording is ${actionLabel}d, but the cloud recording may not reflect this.`,
      type: "error",
      duration: 8000,
    });

    throw err;
  }
}

/**
 * Update the puppet status field on the meeting document.
 * Fire-and-forget — errors are logged but not surfaced to the user.
 */
export function updatePuppetStatus(
  meetingId: string,
  status: "paused" | "active",
): void {
  const mutation =
    status === "paused"
      ? PauseRealtimeMeetingDocument
      : ResumeRealtimeMeetingDocument;

  const startMs = Date.now();
  logger.info(
    `[updatePuppetStatus] Setting puppet status to ${status} for meeting ${meetingId}`,
  );

  apolloClient
    .mutate({
      mutation,
      variables: { meetingId },
    })
    .then(() => {
      const durationMs = Date.now() - startMs;
      logger.info(
        `[updatePuppetStatus] SUCCESS: ${status} for meeting ${meetingId} in ${durationMs}ms`,
      );
      if (durationMs > SLOW_SYNC_THRESHOLD_MS) {
        logger.warn(
          `[updatePuppetStatus] SLOW: took ${durationMs}ms for meeting ${meetingId}`,
        );
      }
    })
    .catch((err) => {
      const durationMs = Date.now() - startMs;
      logger.error(`Failed to set puppet status to ${status}`, {
        err,
        durationMs,
        meetingId,
      });
    });
}

const RESUME_REQUEST_DEADLINE_MS = 10_000;
let resumeRequestDeadlineMs = RESUME_REQUEST_DEADLINE_MS;

/**
 * Resumes a meeting the backend still has as paused so the completed stop that
 * follows ends a live meeting. Best effort: a failed resume never blocks the stop.
 */
export async function resumeRealtimeMeetingBeforeStop(
  meetingId: string,
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), resumeRequestDeadlineMs);

  try {
    const result = await apolloClient.mutate({
      mutation: ResumeRealtimeMeetingDocument,
      variables: { meetingId },
      context: { fetchOptions: { signal: controller.signal } },
    });

    if (result.errors?.length) {
      throw new Error(result.errors[0].message);
    }

    logger.info("resumed paused realtime meeting before stop", { meetingId });
  } catch (err) {
    if (controller.signal.aborted) {
      logger.warn("resumeRealtimeMeeting aborted after deadline", {
        meetingId,
      });
    } else {
      logger.warn("failed to resume paused realtime meeting before stop", {
        err,
        meetingId,
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

export function __setResumeRequestDeadlineForTests(deadlineMs: number): void {
  resumeRequestDeadlineMs = deadlineMs;
}

const stopRequests = new Map<string, Promise<boolean>>();
const stoppedMeetingIds = new Set<string>();
const STOP_REQUEST_DEADLINE_MS = 15_000;
let stopRequestDeadlineMs = STOP_REQUEST_DEADLINE_MS;

async function requestStop({
  meetingId,
  duration,
  completed,
}: {
  meetingId: string;
  duration?: number;
  completed?: boolean;
}): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), stopRequestDeadlineMs);

  try {
    const result = await apolloClient.mutate({
      mutation: StopRealtimeMeetingDocument,
      variables: { meetingId, duration, completed },
      context: { fetchOptions: { signal: controller.signal } },
    });

    if (result.errors?.length) {
      throw new Error(result.errors[0].message);
    }

    logger.info("realtime meeting stopped", { meetingId, completed });
    stoppedMeetingIds.add(meetingId);
    return true;
  } catch (err) {
    if (controller.signal.aborted) {
      logger.warn("stopRealtimeMeeting aborted after deadline", {
        meetingId,
      });
    }
    logger.error("Failed to stop realtime meeting", err);
    captureException(
      new Error(getErrorMessage(err, "recorder: stopRealtimeMeeting")),
      {
        tags: { section: "puppet-sync", meetingId },
        extra: { completed },
      },
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * End the puppet and, for a completed recording, trigger processing.
 * Does not throw; resolves false when the request fails or is aborted after
 * the deadline, after which a retry sends a new request.
 */
export async function stopRealtimeMeeting({
  meetingId,
  duration,
  completed,
}: {
  meetingId: string;
  duration?: number;
  completed?: boolean;
}): Promise<boolean> {
  if (stoppedMeetingIds.has(meetingId)) return true;

  let inflight = stopRequests.get(meetingId);
  if (!inflight) {
    inflight = requestStop({ meetingId, duration, completed });
    stopRequests.set(meetingId, inflight);
    void inflight.finally(() => {
      if (stopRequests.get(meetingId) === inflight) {
        stopRequests.delete(meetingId);
      }
    });
  }

  return inflight;
}

// Bounded by the shutdown acknowledgement window in the main process (60s):
// three 15s attempts fit inside it with room to report the outcome.
const SHUTDOWN_STOP_ATTEMPTS = 3;

/**
 * The quit-path variant: spend the shutdown acknowledgement window on fresh
 * attempts instead of giving up after one. Each attempt is still aborted at
 * the request deadline, but on shutdown this window is the meeting's last
 * chance to be marked ended — the renderer dies with the app, so a request
 * that never landed leaves the meeting live on the homepage.
 */
export async function stopRealtimeMeetingForShutdown(options: {
  meetingId: string;
  duration?: number;
  completed?: boolean;
}): Promise<boolean> {
  for (let attempt = 1; attempt <= SHUTDOWN_STOP_ATTEMPTS; attempt++) {
    if (await stopRealtimeMeeting(options)) return true;
    logger.warn("shutdown realtime stop attempt failed", {
      meetingId: options.meetingId,
      attempt,
    });
  }
  return false;
}

export function __setStopRequestDeadlineForTests(deadlineMs: number): void {
  stopRequestDeadlineMs = deadlineMs;
}

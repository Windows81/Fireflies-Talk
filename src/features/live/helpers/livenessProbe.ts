import type { Meeting } from "@/graphql";
import { isNotFoundError } from "@/errors/auth";
import { isLiveMeeting } from "../constants";

type MeetingLivenessData = {
  meeting?: Pick<Meeting, "status"> | null;
};

export type LivenessProbe = {
  /** The data the server answered with, absent when it answered nothing. */
  data?: MeetingLivenessData | null;
  /** Resolver errors the server answered with, if any. */
  errors?: ReadonlyArray<unknown>;
  /** The request never reached the server. */
  networkError?: unknown;
};

/**
 * Decides whether a probe of the meeting means the live session is over. Only an
 * answer the server gave about this meeting can end a session, because retrying
 * can never succeed: a meeting it no longer has (an empty answer or NOT_FOUND)
 * is terminal, while a meeting it never answered for keeps the session alive so
 * a flaky backend doesn't cut a meeting short.
 */
export const isLiveSessionOver = ({
  data,
  errors = [],
  networkError,
}: LivenessProbe) => {
  if (networkError) return false;
  if (data?.meeting) return !isLiveMeeting(data.meeting);
  if (!data) return errors.some(isNotFoundError);

  return errors.length === 0 || errors.some(isNotFoundError);
};

/**
 * Decides whether a live screen has been silent long enough to ask the server
 * whether its meeting is still running.
 *
 * `msSinceLastSignal` is measured from the last transcript or, when none has
 * arrived, from when the screen mounted. It deliberately does not require a
 * first transcript: desktop recordings stream transcripts over Electron IPC to
 * the recorder and the live view only, so a live screen in any other renderer
 * never receives one and would otherwise never probe at all.
 */
export const shouldProbeMeetingLiveness = ({
  isDiscarding,
  msSinceLastSignal,
  idleThresholdMs,
}: {
  /** Discard already deletes the meeting and tears the session down itself. */
  isDiscarding: boolean;
  msSinceLastSignal: number;
  idleThresholdMs: number;
}) => {
  if (isDiscarding) return false;

  return msSinceLastSignal >= idleThresholdMs;
};

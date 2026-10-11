import type { LocalMeetingRecord } from "@/features/desktop-meeting-detection";
import type { AudioEvent } from "../desktop-meeting-detection/audio-monitor/types";
import { BROWSER_PATTERNS } from "../desktop-meeting-detection/types";
import type { MeetingEvent } from "../desktop-meeting-detection/types";
import {
  getNormalizedProcessName,
  getPlatformFromUrl,
  isTeamsPlatform,
} from "../desktop-meeting-detection/meetingPlatforms";
import type { RecordingSource } from "./types";

export type ProcessBinding = {
  processId: number;
  processName?: string;
  parentProcessName?: string;
  parentProcessId?: number;
};

export type ObservedProcess = {
  processName: string;
  parentProcessName?: string;
  /** Meeting platform the process is known to host (from its meeting URL), when detected. */
  platform?: string;
};

export const toProcessBinding = (event: AudioEvent): ProcessBinding => ({
  processId: event.processID,
  processName: event.processName,
  parentProcessName: event.parentProcessName,
  parentProcessId: event.parentProcessID,
});

/** Platform identity: a meeting URL is authoritative, the reported platform is the fallback. */
const resolvePlatform = (meetingUrl?: string, platform?: string): string =>
  (meetingUrl ? getPlatformFromUrl(meetingUrl) : null) || platform || "";

const isSamePlatform = (a: string, b: string): boolean =>
  a === b || (isTeamsPlatform(a) && isTeamsPlatform(b));

export const matchesRecordingSource = (
  event: ObservedProcess,
  expectedPlatform: string,
  allowAnyPlatform: boolean,
): boolean => {
  if (allowAnyPlatform || !expectedPlatform) {
    return true;
  }

  const observedPlatform = getNormalizedProcessName(
    event.processName,
    event.parentProcessName,
  );
  const normalizedExpected = expectedPlatform.toLowerCase();

  if (isSamePlatform(observedPlatform, normalizedExpected)) {
    return true;
  }

  // A browser process can host any meeting platform, so only the platform it was
  // detected hosting identifies it. Without that identity it must not match.
  const isBrowserObserved = BROWSER_PATTERNS.some((pattern) =>
    observedPlatform.includes(pattern),
  );
  const hostedPlatform = event.platform?.toLowerCase();
  if (!isBrowserObserved || !hostedPlatform) {
    return false;
  }

  return isSamePlatform(hostedPlatform, normalizedExpected);
};

/** Platform the source expects, derived from its meeting URL first, then its platform field. */
export const getExpectedPlatform = (source: RecordingSource): string =>
  resolvePlatform(source.meetingUrl, source.platform);

const toObservedProcess = (event: MeetingEvent): ObservedProcess => ({
  processName: event.processName ?? "",
  parentProcessName: event.parentProcessName,
  platform: resolvePlatform(event.originalUrl, event.platform) || undefined,
});

const toObservedMicProcess = (event: AudioEvent): ObservedProcess => ({
  processName: event.processName,
  parentProcessName: event.parentProcessName,
  platform: resolvePlatform(event.meetingUrl) || undefined,
});

/**
 * Whether the process holding the mic belongs to the source's expected platform.
 * The meeting URL main attached to the event identifies which meeting a browser hosts.
 */
export const isMicProcessForSource = (
  source: RecordingSource,
  event: AudioEvent,
): boolean => {
  const expectedPlatform = getExpectedPlatform(source);
  return matchesRecordingSource(
    toObservedMicProcess(event),
    expectedPlatform,
    !expectedPlatform,
  );
};

/** Whether a mic_started from an unbound source should attach that process (late binding). */
export const shouldBindOnMicStarted = (source: RecordingSource): boolean =>
  !source.processId;

/**
 * Pick the already-detected meeting-app process for an unbound source when the recording
 * starts (the app already held the mic, so no later mic_started will arrive).
 */
export const findDetectedProcessForSource = (
  source: RecordingSource,
  localMeetings: LocalMeetingRecord[],
): ProcessBinding | undefined => {
  if (source.processId) return undefined;

  const expectedPlatform = getExpectedPlatform(source);
  const allowAnyPlatform = !expectedPlatform;
  const candidates = localMeetings
    .filter(
      (item) =>
        item.event.processId &&
        item.status !== "ended" &&
        matchesRecordingSource(
          toObservedProcess(item.event),
          expectedPlatform,
          allowAnyPlatform,
        ),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const candidate = candidates[0];

  if (!candidate?.event.processId) return undefined;
  return {
    processId: candidate.event.processId,
    processName: candidate.event.processName,
    parentProcessName: candidate.event.parentProcessName,
    parentProcessId: candidate.event.parentProcessId,
  };
};

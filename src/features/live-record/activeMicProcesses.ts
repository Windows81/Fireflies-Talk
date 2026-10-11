import type { AudioEvent } from "../desktop-meeting-detection/audio-monitor/types";
import {
  isMicProcessForSource,
  toProcessBinding,
  type ProcessBinding,
} from "./recordingSourceProcess";
import { isMeetingApp } from "../desktop-meeting-detection/meetingPlatforms";
import type { RecordingSource } from "./types";

type ProcessGroupInput = Pick<
  RecordingSource,
  "processId" | "parentProcessId" | "parentProcessName"
>;

/**
 * Identity of the app instance that owns a mic-holding process. The key is
 * always a pid; the parent's name only decides whether that parent is the app
 * itself or the OS launcher.
 *
 * Helper processes (Chrome/Electron renderers, Teams WebView2) report the app
 * as their parent, so they group under the parent's pid. Top-level apps report
 * the OS launcher (launchd on macOS, explorer.exe on Windows), which must not
 * group unrelated apps together, so they key by their own pid.
 */
export const getProcessGroupKey = (
  process: ProcessGroupInput,
): number | undefined => {
  const hasAppParent =
    process.parentProcessId !== undefined &&
    !!process.parentProcessName &&
    isMeetingApp(process.parentProcessName);
  return hasAppParent ? process.parentProcessId : process.processId;
};

export const isSameProcessGroup = (
  event: AudioEvent,
  source: RecordingSource,
): boolean =>
  getProcessGroupKey(toProcessBinding(event)) === getProcessGroupKey(source);

/**
 * Whether a mic release belongs to the bound source: the bound process itself or
 * a sibling in its app instance. Events from an exited process still qualify
 * because the monitor emits them with the identity it cached while the process
 * was alive.
 */
export const isMicReleaseForSource = (
  event: AudioEvent,
  source: RecordingSource,
): boolean => {
  if (!source.processId) return false;
  return (
    source.processId === event.processID || isSameProcessGroup(event, source)
  );
};

/**
 * Tracks meeting-app processes currently holding the mic. Keeps the full event
 * so a browser's hosted meeting (main-enriched meetingUrl) stays available for
 * matching a source that starts recording later.
 */
export const createActiveMicProcessTracker = () => {
  const byPid = new Map<number, AudioEvent>();

  return {
    onMicStarted(event: AudioEvent): void {
      if (!isMeetingApp(event.processName, event.parentProcessName)) return;

      byPid.set(event.processID, event);
    },

    onMicStopped(pid: number): void {
      byPid.delete(pid);
    },

    list(): AudioEvent[] {
      return [...byPid.values()];
    },
  };
};

export const findActiveMicProcessForSource = (
  source: RecordingSource,
  activeMicEvents: AudioEvent[],
): ProcessBinding | undefined => {
  if (source.processId) return undefined;

  const match = activeMicEvents.find((event) =>
    isMicProcessForSource(source, event),
  );
  return match && toProcessBinding(match);
};

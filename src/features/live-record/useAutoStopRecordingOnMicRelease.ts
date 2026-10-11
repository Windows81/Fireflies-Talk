import { useEffect } from "react";
import { isDesktop } from "@/utils/device";
import { Logger } from "@/logger";
import { recorderApi, useRecorder } from "./record.store";
import type { AudioEvent } from "@/features/desktop-meeting-detection/audio-monitor/types";
import {
  isMeetingApp,
  meetingDetectionApi,
  useMeetingDetectionStore,
} from "@/features/desktop-meeting-detection";
import {
  createMicReleaseGraceController,
  type RecorderSnapshot,
} from "./micReleaseGraceController";
import {
  findDetectedProcessForSource,
  isMicProcessForSource,
  shouldBindOnMicStarted,
  toProcessBinding,
  type ProcessBinding,
} from "./recordingSourceProcess";
import {
  createActiveMicProcessTracker,
  findActiveMicProcessForSource,
  isMicReleaseForSource,
  isSameProcessGroup,
} from "./activeMicProcesses";
import type { RecordingSource } from "./types";

const log = new Logger("AudioRecord");

/**
 * Listens for mic_stopped events directly via the IPC bridge and auto-stops the
 * active recording when the matching process releases its mic — but tolerates
 * temporary drops caused by network outages.
 *
 * The stop decision is delegated to a pure grace controller: on mic loss it
 * waits, then probes network reachability. Reachable means the meeting really
 * ended (stop); unreachable means a likely outage (keep the session alive and
 * retry, up to a hard cap) so a brief blip + waiting-room rejoin stays a single
 * recording instead of being lost. See
 * docs/superpowers/specs/2026-06-29-outage-tolerant-auto-stop-design.md.
 *
 * Subscribes to the raw IPC channel (not useAudioMonitor) to avoid registering a
 * duplicate "audio-event" listener alongside useMeetingDetection. Process
 * binding applies to all sources, including processes that use multiple helper PIDs.
 */
export const useAutoStopRecordingOnMicRelease = () => {
  useEffect(() => {
    if (!isDesktop || !window.electron?.audioMonitor) return;

    const tracker = createActiveMicProcessTracker();

    const bindProcess = (binding: ProcessBinding) => {
      const recorderState = useRecorder.getState();
      if (recorderState.status.state === "inactive") return;

      const context = recorderState.context;
      const source = context?.recordingSource;
      if (!context || !source) return;

      const updatedSource = { ...source, ...binding };
      recorderState.setContext({
        ...context,
        recordingSource: updatedSource,
      });
      meetingDetectionApi.markLocalMeetingRecording(
        updatedSource,
        context.meetingId,
      );
    };

    const tryBindDetectedProcess = () => {
      const { status, context } = useRecorder.getState();
      if (status.state === "inactive") return;

      const source = context?.recordingSource;
      if (!source || source.processId) return;

      const binding =
        findDetectedProcessForSource(
          source,
          meetingDetectionApi.getState().localMeetings,
        ) ?? findActiveMicProcessForSource(source, tracker.list());
      if (binding) bindProcess(binding);
    };

    const getSnapshot = (): RecorderSnapshot => {
      const { status, context } = useRecorder.getState();
      return {
        isActive: status.state !== "inactive",
        processId: context?.recordingSource?.processId,
        meetingId: context?.meetingId,
      };
    };

    const controller = createMicReleaseGraceController({
      now: () => Date.now(),
      schedule: (fn, ms) => setTimeout(fn, ms),
      cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      // Probe lives in main; if the bridge is missing, fail safe to reachable.
      // Main races hardcoded HTTPS anchors (Fireflies health + Cloudflare).
      // Missing bridge → fail safe to reachable so the old "stop on mic loss"
      // behavior still applies.
      isReachable: async () => {
        const probe = window.electron?.network?.isReachable;
        if (!probe) return true;
        return probe();
      },
      getSnapshot,
      stopRecording: () => recorderApi.stop().then(() => undefined),
      onError: (message, meta) => log.error(message, meta),
    });

    const cancelMicRelease = (
      graceKey: number,
      event: AudioEvent,
      source: RecordingSource | undefined,
    ) => {
      if (!controller.onMicStarted(graceKey)) return;
      log.info("mic release grace cancelled", {
        pid: event.processID,
        boundPid: source?.processId,
      });
    };

    const cancelGroupMicRelease = (
      event: AudioEvent,
      source: RecordingSource | undefined,
    ) => {
      if (!source?.processId || !isSameProcessGroup(event, source)) return;

      cancelMicRelease(source.processId, event, source);
    };

    // A group-level stop arms the grace timer; a same-group mic_started cancels it.
    const handleMicStopped = (
      event: AudioEvent,
      source: RecordingSource | undefined,
    ) => {
      if (!source?.processId || !isMicReleaseForSource(event, source)) return;

      log.info("mic release grace armed", {
        pid: event.processID,
        boundPid: source.processId,
      });
      controller.onMicStopped(source.processId);
    };

    // Logged before any early return so a meeting app re-acquiring the mic
    // after the recording already stopped is still visible in telemetry.
    // The recorder context outlives the recording, so it is only attached
    // when the event belongs to the bound process group.
    const logMeetingAppMicEvent = (event: AudioEvent) => {
      if (!isMeetingApp(event.processName, event.parentProcessName)) return;

      const { context } = useRecorder.getState();
      const source = context?.recordingSource;
      const isBoundGroup =
        !!source?.processId &&
        (source.processId === event.processID ||
          isSameProcessGroup(event, source));
      log.info(`meeting app ${event.type}`, {
        pid: event.processID,
        processName: event.processName,
        parentProcessName: event.parentProcessName,
        parentProcessID: event.parentProcessID,
        boundPid: isBoundGroup ? source.processId : undefined,
        meetingId: isBoundGroup ? context?.meetingId : undefined,
      });
    };

    const cleanupAudio = window.electron.audioMonitor.onAudioEvent(
      (event: AudioEvent) => {
        const pid = event.processID;
        logMeetingAppMicEvent(event);

        if (event.type === "mic_started") {
          tracker.onMicStarted(event);
          const recorderState = useRecorder.getState();
          const source = recorderState.context?.recordingSource;
          // Mic came back — cancel any pending auto-stop for this process.
          cancelMicRelease(pid, event, source);
          cancelGroupMicRelease(event, source);
          if (!isMeetingApp(event.processName, event.parentProcessName)) return;
          if (!source || !shouldBindOnMicStarted(source)) return;
          if (!isMicProcessForSource(source, event)) return;

          bindProcess(toProcessBinding(event));
          return;
        }

        if (event.type !== "mic_stopped") return;
        tracker.onMicStopped(pid);

        const { status, context } = useRecorder.getState();
        const recordingSource = context?.recordingSource;

        if (status.state === "inactive") return;
        handleMicStopped(event, recordingSource);
      },
    );

    // Any path that ends the recording (manual stop, completion) must cancel
    // pending grace loops so they cannot fire a stale stop later.
    const unsubscribeRecorder = useRecorder.subscribe((state, prevState) => {
      if (
        prevState.status.state !== "inactive" &&
        state.status.state === "inactive"
      ) {
        controller.cancelAll();
        return;
      }

      tryBindDetectedProcess();
    });
    const unsubscribeDetection = useMeetingDetectionStore.subscribe(
      (state, prevState) => {
        if (state.localMeetings !== prevState.localMeetings) {
          tryBindDetectedProcess();
        }
      },
    );

    return () => {
      cleanupAudio?.();
      unsubscribeRecorder();
      unsubscribeDetection();
      controller.cancelAll();
    };
  }, []);
};

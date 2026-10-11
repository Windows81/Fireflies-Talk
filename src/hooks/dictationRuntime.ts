import {
  getDictationLanguageHints,
  getLocalSettings,
  type DictationTranscriptionProvider,
} from "@/features/settings";
import {
  resolveDictationCue,
  type DictationCueEvent,
} from "./dictationCueEvents";
import { playDictationCue, preloadDictationCues } from "./dictationCues";
import { createStartCueGate } from "./dictationStartCue";
import { awaitScreenContextBriefly } from "./dictationScreenContextWait";
import {
  formatDictationServiceError,
  isDictationCancelledError,
  micPermissionDeniedMessage,
  notifyDictationError,
  notifyDictationNotice,
  notifyDictationStartError,
} from "./dictationErrors";
import {
  prewarmDictationMeterContext,
  startDictationLevelMeter,
  stopDictationLevelMeter,
} from "./dictationMicMeter";
import { prewarmFredConnection } from "./dictationCommand";
import { claimDictationRecording } from "./dictationInAppCapture";
import { createMeetingMicSync } from "./dictationMeetingMic";
import {
  fetchDictationScribeToken,
  pingDictationService,
} from "./dictationApi";
import { createDictationHeartbeat } from "./dictationHeartbeat";
import { createRecordingTraits } from "./dictationRecordingTraits";
import { startDictationMicrophoneWatcher } from "./dictationMicrophoneWatcher";
import { prewarmDictationPcmContext } from "./dictationPcmContext";
import { getDictationStreamClient } from "./dictationStreamClient";
import { openMicrophoneForDictation } from "./dictationRuntimeMicrophone";
import { subscribeDictationPolish } from "./dictationPolishSelection";
import {
  shouldReadDictationScreenContext,
  usableScreenContext,
} from "./dictationScreenContextPolicy";
import { createDictationProcessor } from "./dictationProcessing";
import {
  abortDetachedActionRuns,
  dismissDetachedActionRun,
  republishDetachedActionRuns,
} from "./dictationDetachedRun";
import {
  startDictationSession,
  type DictationScribeCredentials,
  type DictationSession,
} from "./dictationSession";
import {
  createSpeechGateState,
  type SpeechGateState,
} from "./dictationSpeechGate";
import {
  createDictationAutoStopController,
  maxDictationAudioSeconds,
} from "./dictationAutoStop";
import { writeArmedDictationMaxSeconds } from "./dictationArmedCap";
import {
  createDictationReleaseTiming,
  getPositiveDurationMs,
  type DictationReleaseTiming,
} from "./dictationTiming";
import { nextDictationModeForState } from "electron/src/dictation/dictation-mode";
import type {
  DictationScreenContext,
  DictationMode,
  DictationState,
} from "electron/src/types";
import {
  acceptDictationStop,
  canCommitDictationStop,
  pasteEpochOrZero,
} from "./dictationRuntimeStop";
import { setMicrophoneMuted } from "@/modules/audio-record";

let micPermissionGranted = false;

export function startDictationRuntime(deps: {
  getTranscriptionProvider: () => DictationTranscriptionProvider;
  isScreenContextDisabled: () => boolean;
}): () => void {
  const stateRef = { current: "idle" as DictationState };
  const modeRef = { current: "dictate" as DictationMode };
  const streamRef = { current: null as MediaStream | null };
  const audioContextRef = { current: null as AudioContext | null };
  const levelIntervalRef = {
    current: null as ReturnType<typeof setInterval> | null,
  };
  const speechGateRef = { current: null as SpeechGateState | null };
  const cancelledRef = { current: false };
  const screenContextPromiseRef = {
    current: null as Promise<DictationScreenContext | null> | null,
  };
  const readScreenContext = (mode: DictationMode) =>
    shouldReadDictationScreenContext({
      disabledByAdmin: deps.isScreenContextDisabled(),
      enabledByUser: getLocalSettings().useScreenContextForDictation,
      mode,
    })
      ? window.electron!.dictation.getScreenContext()
      : null;
  const screenContextCapture = () =>
    usableScreenContext(
      screenContextPromiseRef.current,
      deps.isScreenContextDisabled,
    );
  const sessionRef = { current: null as DictationSession | null };
  const startReadyRef = { current: null as Promise<void> | null };
  const silentCaptureRef = { current: false };
  const revealedRef = { current: false };
  const releaseTimingRef = { current: null as DictationReleaseTiming | null };
  const recordingTraits = createRecordingTraits({
    getTranscriptionProvider: deps.getTranscriptionProvider,
    getLanguageHintsCount: () => getDictationLanguageHints().length,
  });
  const recordingStartedAtRef = { current: null as number | null };
  const recordingDurationMsRef = { current: undefined as number | undefined };
  const dictationIdRef = { current: undefined as string | undefined };

  const maxAudioSecondsRef = {
    current: maxDictationAudioSeconds("assembly"),
  };

  const setMaxAudioSeconds = (maxSeconds: number) => {
    maxAudioSecondsRef.current = maxSeconds;
    writeArmedDictationMaxSeconds(maxSeconds);
  };

  let pasteEpoch = 0;
  let stopAccepted = false;
  const requestOwnStop = () => window.electron!.dictation.requestStop("auto");
  let unwatchMicrophoneEnded = () => {};
  const prewarmAudioContexts = () => {
    prewarmDictationPcmContext();
    prewarmDictationMeterContext();
  };
  const heartbeat = createDictationHeartbeat(pingDictationService);
  const stopStream = () => {
    heartbeat.stop();
    unwatchMicrophoneEnded();
    stopDictationLevelMeter({ audioContextRef, levelIntervalRef });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    window.electron!.dictation.reportCaptureReleased();
  };

  const resetRecordingClock = () => {
    recordingStartedAtRef.current = null;
    recordingDurationMsRef.current = undefined;
    dictationIdRef.current = undefined;
    setMaxAudioSeconds(maxDictationAudioSeconds("assembly"));
  };

  const captureRecordingDuration = () => {
    recordingDurationMsRef.current = getPositiveDurationMs(
      recordingStartedAtRef.current,
    );
    recordingStartedAtRef.current = null;
  };
  const autoStop = createDictationAutoStopController({
    onStop: requestOwnStop,
  });

  const returnToIdle = () => {
    startCueGate.cancel();
    sessionRef.current?.cancel();
    sessionRef.current = null;
    stopStream();
    resetRecordingClock();
    silentCaptureRef.current = false;
    revealedRef.current = false;
    speechGateRef.current = null;
    screenContextPromiseRef.current = null;
    releaseTimingRef.current = null;
    autoStop.disarm();
    stopAccepted = false;
    setState("idle");
  };

  const syncMeetingMic = createMeetingMicSync(setMicrophoneMuted);
  const setState = (state: DictationState) => {
    stateRef.current = state;
    modeRef.current = nextDictationModeForState(state, modeRef.current);
    syncMeetingMic(state);
    window.electron!.dictation.reportState(state, modeRef.current);
    // Re-warm once the dictation is done, off both the press and the release
    // paths: building the contexts blocks the main thread.
    if (state === "idle") prewarmAudioContexts();
  };

  const reportPhase = (phase: string) => {
    window.electron!.dictation.reportPhase(phase);
  };

  const { runProcessing, runPolishSelection, cancelProcessing } =
    createDictationProcessor({
      modeRef,
      releaseTimingRef,
      recordingDurationMsRef,
      dictationIdRef,
      screenContextPromiseRef,
      getScreenContextCapture: screenContextCapture,
      speechGateRef,
      reportPhase,
      setState,
      resetRecordingClock,
      getPasteEpoch: () => pasteEpoch,
      getRecordingTraits: recordingTraits.current,
    });

  let captureGeneration = 0;
  let surfacedServiceError = false;

  const surfaceServiceError = (error: unknown): void => {
    if (surfacedServiceError || isDictationCancelledError(error)) return;
    surfacedServiceError = true;
    notifyDictationError(formatDictationServiceError(error));
  };

  const applyRecordingMode = (mode: DictationMode) => {
    if (cancelledRef.current) return;
    if (stateRef.current !== "recording") return;
    if (mode !== "command" || modeRef.current === "command") return;
    modeRef.current = "command";
    window.electron!.dictation.reportState(stateRef.current, mode);
    if (!screenContextPromiseRef.current) {
      screenContextPromiseRef.current = readScreenContext("command");
    }
  };

  const playCue = (event: DictationCueEvent) => {
    const cue = resolveDictationCue(
      event,
      getLocalSettings().dictationSoundEffects,
    );
    if (cue) void playDictationCue(cue);
  };
  // The start cue means "speak now", so it waits for the microphone to be
  // recording instead of firing at reveal.
  const startCueGate = createStartCueGate({
    play: (handsFree) => playCue({ type: "start", handsFree }),
  });

  const revealRecording = (mode: DictationMode, handsFree: boolean) => {
    if (cancelledRef.current) return;
    if (stateRef.current !== "idle") return;

    modeRef.current = mode;
    revealedRef.current = true;
    silentCaptureRef.current = false;
    setState("recording");
    autoStop.arm(maxAudioSecondsRef.current);
    startCueGate.reveal(handsFree);
    recordingTraits.revealed(handsFree);

    screenContextPromiseRef.current = readScreenContext(mode);

    if (mode === "command") prewarmFredConnection();
    sessionRef.current?.connect();
  };
  const startCapture = async (
    scribeCredentials?: Promise<DictationScribeCredentials>,
    provider = deps.getTranscriptionProvider(),
  ) => {
    // Whichever surface is listening now owns this recording's text, even if
    // the onboarding mounts or unmounts before the transcription lands.
    claimDictationRecording();
    startCueGate.beginCapture();
    recordingTraits.beginCapture();
    heartbeat.start();
    const generation = ++captureGeneration;
    surfacedServiceError = false;
    stopAccepted = false;
    silentCaptureRef.current = true;
    cancelledRef.current = false;
    speechGateRef.current = createSpeechGateState();
    setMaxAudioSeconds(maxDictationAudioSeconds(provider));

    const setupPromise = (async () => {
      if (!micPermissionGranted) {
        const granted =
          await window.electron!.permissions.request("microphone");
        if (generation !== captureGeneration || cancelledRef.current) return;
        if (!granted) {
          notifyDictationError(micPermissionDeniedMessage());
          returnToIdle();
          return;
        }
        micPermissionGranted = true;
      }

      const opened = await openMicrophoneForDictation({
        isStale: () => generation !== captureGeneration || cancelledRef.current,
        isRevealed: () => revealedRef.current,
        requestStop: requestOwnStop,
        requestCancel: () => window.electron!.dictation.requestCancel(),
      });
      if (!opened) return;

      const { stream } = opened;
      recordingTraits.micOpened(stream.getAudioTracks()[0]?.label ?? "");
      streamRef.current = stream;
      unwatchMicrophoneEnded = opened.unwatch;
      recordingStartedAtRef.current = Date.now();
      startDictationLevelMeter({
        stream,
        audioContextRef,
        levelIntervalRef,
        speechGateRef,
        shouldReportLevel: () => revealedRef.current,
      });

      const session = startDictationSession(stream, provider, {
        connectImmediately: false,
        scribeCredentials,
        getCommitContext: async () => {
          const timing = releaseTimingRef.current;
          return {
            screenContext: await awaitScreenContextBriefly(
              screenContextCapture(),
            ),
            releasedKeyAt: timing
              ? new Date(timing.releaseAt).toISOString()
              : undefined,
            disableFormatting: modeRef.current === "command",
            recordingDurationMs: recordingDurationMsRef.current,
          };
        },
        // Action mode captures the screen for its own use; the dictation
        // service only gets it when the person allows screen context.
        getScreenContext: () =>
          getLocalSettings().useScreenContextForDictation
            ? screenContextPromiseRef.current
            : null,
      });
      sessionRef.current = session;
      startCueGate.markMicReady();
      void session.ready.catch((error) => {
        if (sessionRef.current !== session) return;
        surfaceServiceError(error);
        window.electron!.dictation.requestCancel();
      });
      if (revealedRef.current) session.connect();
    })();

    startReadyRef.current = setupPromise;
    try {
      await setupPromise;
    } catch (error) {
      if (generation !== captureGeneration) return;
      if (!cancelledRef.current) notifyDictationStartError(error);
      returnToIdle();
    } finally {
      if (startReadyRef.current === setupPromise) {
        startReadyRef.current = null;
      }
    }
  };

  const beginCaptureForProvider = () => {
    const provider = deps.getTranscriptionProvider();
    let scribeCredentials: Promise<DictationScribeCredentials> | undefined;
    switch (provider) {
      case "elevenlabs":
        scribeCredentials = fetchDictationScribeToken();
        // Owned here so a cancel or mic deny before the session exists
        // does not leave an unhandled rejection.
        void scribeCredentials.catch(() => undefined);
        break;
      case "stream":
        // Opens the socket while the microphone starts.
        getDictationStreamClient().warm();
        break;
      case "assembly":
      case "assembly-chunked":
        break;
      default: {
        const _exhaustive: never = provider;
        return _exhaustive;
      }
    }
    return startCapture(scribeCredentials, provider);
  };

  const startRecording = (mode: DictationMode, handsFree: boolean) => {
    void beginCaptureForProvider();
    revealRecording(mode, handsFree);
  };

  const awaitStartReady = async () => {
    const startReady = startReadyRef.current;
    if (startReady) {
      try {
        await startReady;
      } catch {
        return false;
      }
    }

    const session = sessionRef.current;
    if (!session?.hasConnected) return canCommitDictationStop(stateRef.current);
    try {
      await session.ready;
      return canCommitDictationStop(stateRef.current);
    } catch (error) {
      surfaceServiceError(error);
      return false;
    }
  };

  const cleanupCapture = window.electron!.dictation.onCapture(() => {
    if (stateRef.current !== "idle" || silentCaptureRef.current) return;
    void beginCaptureForProvider();
  });
  const cleanupStart = window.electron!.dictation.onStart((mode, handsFree) => {
    if (stateRef.current !== "idle") return;
    if (silentCaptureRef.current) {
      revealRecording(mode, handsFree);
      return;
    }
    startRecording(mode, handsFree);
  });
  const cleanupMode = window.electron!.dictation.onMode(applyRecordingMode);
  const cleanupLatched = window.electron!.dictation.onLatched(() => {
    if (stateRef.current !== "recording") return;
    recordingTraits.latched();
    if (startCueGate.latch()) return;
    playCue({ type: "latched" });
  });
  const cleanupStop = window.electron!.dictation.onStop((epoch, source) => {
    if (
      !acceptDictationStop({
        state: stateRef.current,
        stopAccepted,
      })
    ) {
      // A late stop must still publish, or the main process stays busy.
      window.electron!.dictation.reportState(stateRef.current, modeRef.current);
      return;
    }
    stopAccepted = true;
    startCueGate.cancel();
    recordingTraits.stopped(source);
    pasteEpoch = pasteEpochOrZero(epoch);
    autoStop.disarm();

    const timing = createDictationReleaseTiming();
    releaseTimingRef.current = timing;

    playCue({ type: "stop" });

    void (async () => {
      const awaitReadyStartedAt = Date.now();
      if (!(await awaitStartReady())) {
        releaseTimingRef.current = null;
        returnToIdle();
        return;
      }
      timing.awaitReadyMs = Date.now() - awaitReadyStartedAt;

      const session = sessionRef.current;
      if (!session) {
        returnToIdle();
        return;
      }

      sessionRef.current = null;
      dictationIdRef.current = session.dictationId;
      const finalizeStartedAt = Date.now();
      captureRecordingDuration();
      stopStream();
      timing.finalizeMs = Date.now() - finalizeStartedAt;
      void runProcessing(
        () => session.commit(),
        () => session.cancel(),
      );
    })();
  });
  const cleanupCancel = window.electron!.dictation.onCancel(() => {
    if (stateRef.current === "processing") {
      playCue({ type: "cancel" });
      cancelProcessing();
      return;
    }
    if (stateRef.current !== "recording" && !silentCaptureRef.current) return;

    if (revealedRef.current) playCue({ type: "cancel" });
    const generationAtCancel = captureGeneration;
    autoStop.disarm();
    cancelledRef.current = true;
    silentCaptureRef.current = false;
    revealedRef.current = false;

    void (async () => {
      const cancelSession = () => {
        const session = sessionRef.current;
        if (!session) return;
        session.cancel();
        sessionRef.current = null;
      };

      cancelSession();

      // Release the meeting mic now — a pending start (e.g. a mic-permission
      // prompt) can hold the gate for seconds. A later capture mutes again
      // from its own state transition.
      syncMeetingMic("idle");

      const startReady = startReadyRef.current;
      if (startReady) {
        await startReady.catch(() => undefined);
      }

      if (generationAtCancel !== captureGeneration) return;
      returnToIdle();
    })();
  });

  const cleanupPolish = subscribeDictationPolish({
    isProcessing: () => stateRef.current === "processing",
    bumpCaptureGeneration: () => ++captureGeneration,
    getCaptureGeneration: () => captureGeneration,
    cancelledRef,
    silentCaptureRef,
    revealedRef,
    sessionRef,
    startReadyRef,
    screenContextPromiseRef,
    readScreenContext: () => readScreenContext("dictate"),
    stopStream,
    resetRecordingClock,
    runPolishSelection,
    setPasteEpoch: (epoch) => {
      pasteEpoch = pasteEpochOrZero(epoch);
    },
  });

  // Clearing an orb has to drop the run here, where the set is owned, or the
  // next snapshot would put it straight back on screen.
  const cleanupRunDismiss = window.electron!.dictation.onActionRunDismissed?.(
    dismissDetachedActionRun,
  );
  // A reloaded overlay has no runs until something changes, so it may ask for
  // the current set.
  const cleanupRunsRequest = window.electron!.dictation.onActionRunsRequested?.(
    republishDetachedActionRuns,
  );
  const cleanupRunsAbort = window.electron!.dictation.onActionRunsAborted?.(
    abortDetachedActionRuns,
  );

  const cleanupMicrophoneWatcher = startDictationMicrophoneWatcher({
    notify: notifyDictationNotice,
  });

  // A remounted runtime is idle. Publish that so a leftover main-process
  // busy flag from the previous instance cannot block the next start.
  setState("idle");
  preloadDictationCues();

  return () => {
    cleanupMicrophoneWatcher();
    cleanupCapture();
    cleanupStart();
    cleanupMode();
    cleanupLatched();
    cleanupStop();
    cleanupCancel();
    cleanupPolish();
    cleanupRunDismiss?.();
    cleanupRunsRequest?.();
    cleanupRunsAbort?.();
    autoStop.disarm();
    sessionRef.current?.cancel();
    sessionRef.current = null;
    stopStream();
    syncMeetingMic("idle");
  };
}

import { Logger } from "@/logger";
import { withTimeout } from "@/utils/promise";
import { AudioClockMonitor } from "./audio-clock-monitor";
import {
  DeviceWatcher,
  describeTopologyChange,
  microphoneReacquireReason,
  stripPseudoPrefix,
  systemAudioReacquireReason,
  type DeviceTopologyChange,
} from "./device-watcher";
import { findLiveMicrophone, measureStreamMaxDb } from "./mic-probe";
import { PCM_STREAMING_WORKLET_CODE } from "./pcm-streaming-worklet";
import {
  EFFECTIVELY_DEAD_DB,
  SilenceTracker,
  type DeadAirLevels,
  type ReacquireOutcome,
} from "./silence-tracker";

const log = new Logger("AudioRecord");

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export type MediaErrorCode =
  | "E_DEVICE_BUSY"
  | "E_PERMISSION"
  | "E_DEVICE_NOT_FOUND"
  | "E_CONSTRAINT"
  | "E_INIT_FAILED";

// Maps a DOMException from getUserMedia/getDisplayMedia to a stable code +
// user-facing message. Used so the UI can show something more actionable than
// Chromium's "Could not start audio source" — common on Windows 11 25H2 when
// drivers exclusive-lock the endpoint.
export function classifyMediaError(error: unknown): {
  code: MediaErrorCode;
  message: string;
} {
  const name =
    error instanceof DOMException
      ? error.name
      : error instanceof Error && typeof error.name === "string"
        ? error.name
        : "";

  switch (name) {
    case "NotReadableError":
    case "AbortError":
      return {
        code: "E_DEVICE_BUSY",
        message:
          "Microphone is in use by another app or driver. Close Teams, Zoom, voice assistants, or other audio apps and try again.",
      };
    case "NotAllowedError":
    case "SecurityError":
      return {
        code: "E_PERMISSION",
        message:
          "Microphone access was denied. Please allow microphone access for this app in system settings.",
      };
    case "NotFoundError":
      return {
        code: "E_DEVICE_NOT_FOUND",
        message:
          "No microphone was found. Please connect an audio input device and try again.",
      };
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return {
        code: "E_CONSTRAINT",
        message:
          "The selected microphone does not support the requested audio settings.",
      };
    default: {
      const original =
        error instanceof Error ? error.message : String(error ?? "unknown");
      return { code: "E_INIT_FAILED", message: original };
    }
  }
}

// Thrown when the layered mic-acquisition strategy gives up. Carries the
// classified code so callers can emit a user-friendly error without
// re-parsing the underlying DOMException.
export class MicrophoneAcquisitionError extends Error {
  readonly code: MediaErrorCode;
  readonly originalName?: string;
  constructor(code: MediaErrorCode, message: string, originalName?: string) {
    super(message);
    this.name = "MicrophoneAcquisitionError";
    this.code = code;
    this.originalName = originalName;
  }
}

export function isMicrophoneAcquisitionError(
  error: unknown,
): error is MicrophoneAcquisitionError {
  return error instanceof Error && error.name === "MicrophoneAcquisitionError";
}

export interface AudioRecorderCallbacks {
  onTrackEnded?: (source: AudioSourceKind) => void;
  onWorkletError?: (error: string) => void;
  onMicStateChanged?: (micState: "on" | "off", time: number) => void;
  onRecoveryLog?: (message: string) => void;
  /**
   * Called once after the microphone stream has been acquired and before
   * any system-audio (loopback) capture is attempted. Lets the caller
   * perform post-mic side-effects (e.g., installing the Electron loopback
   * handler) at the moment we know the mic endpoint is held by us.
   *
   * - Return `null` to skip system-audio entirely (mic-only fallback).
   * - Throwing is treated the same as returning `null` — the session
   *   continues mic-only instead of failing.
   * - `useCoreAudioTap` in the return value overrides the constructor
   *   value (used so the caller can read the actual loopback config
   *   only after enable() resolves).
   */
  onMicReady?: () => Promise<
    { useCoreAudioTap?: boolean } | null | undefined | void
  >;
  /**
   * Called when system audio capture is abandoned AFTER `onMicReady`
   * succeeded — i.e., the caller-installed loopback handler is still live
   * but we're degrading to mic-only because `getDisplayMedia` failed
   * downstream. Lets the caller tear down the loopback handler
   * immediately rather than leaving it installed for the entire mic-only
   * session (the Electron display-media handler is session-global and
   * affects any other capture path during the recording).
   *
   * NOT called when `onMicReady` itself returned null/threw — in that
   * case the handler was never installed.
   */
  onSystemAudioUnavailable?: () => Promise<void> | void;
}

type BrowserInfo = {
  isFirefox: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isIOS: boolean;
  userAgent: string;
};

export type AudioSourceKind = "microphone" | "system";
type TrackRecoveryTrigger = "mute" | "ended";

export class AudioRecorder {
  // Core audio graph
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  // The user-selected input device, applied on mic acquisition and on live
  // switches. Undefined means "system default".
  private preferredDeviceId?: string;

  // State
  private isRecording = false;
  private isPaused = false;
  private isStopping = false;

  // Callback targets
  private encodedDataCallback: ((data: Uint8Array) => void) | null = null;

  // Sample rates
  private targetSampleRate: number;
  private actualSampleRate = 0;

  // Statistics
  private processedFrames = 0;

  // Metering (not derived from worklet anymore)
  private currentMeterValue = -Infinity;
  private analyserNode: AnalyserNode | null = null;
  private analyserBuffer: Float32Array<ArrayBuffer> | null = null;
  private meterTimer: ReturnType<typeof setInterval> | null = null;

  // Health monitoring
  private lastDataTime = Date.now();
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly dataTimeoutMs = 30000;
  private audioContextRecoveryInProgress = false;
  private graphRecoveryInProgress = false;
  private lastGraphRecoveryTime = 0;
  private graphRecoveryAttemptsWithoutData = 0;
  private dataFlowSequence = 0;
  private dataFlowDeadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private dataFlowDeadlineAt = 0;
  private audioClockMonitor = new AudioClockMonitor();

  // Duration tracking
  private startTimestampMs: number | null = null;
  private accumulatedDurationMs = 0;

  // Browser detection
  private browserInfo: BrowserInfo = this.detectBrowser();

  // MediaRecorder mode (only)
  private mediaDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaMimeType: string | undefined;
  private mediaTimesliceMs: number | undefined;
  private sourceKeepAliveNode: GainNode | null = null;
  private singleSourceTargets: AudioNode[] = [];

  // Safari-specific tracking
  private lastMuteTime: number | null = null;
  private consecutiveMuteEvents = 0;

  // System audio (desktop only)
  private enableSystemAudio = false;
  // CoreAudioTap uses video:false, ScreenCaptureKit uses video:true
  private useCoreAudioTap = false;
  // Pre-captured stream to use instead of getDisplayMedia (bypasses Chromium self-exclusion)
  private systemAudioStreamOverride: MediaStream | null = null;

  // Dual audio capture (mic + system audio)
  private micStream: MediaStream | null = null;
  private systemStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private systemSourceNode: MediaStreamAudioSourceNode | null = null;
  private micGainNode: GainNode | null = null;
  private systemGainNode: GainNode | null = null;
  private systemSourceTargets: AudioNode[] = [];

  // Compliance gate: zeroed while the recording policy forbids audio. Held on
  // the recorder rather than only on the node so a graph rebuilt by recovery
  // comes back silenced instead of quietly resuming capture.
  private complianceGainNode: GainNode | null = null;
  private silenced = false;

  // Microphone gate: zeroed while the user's voice belongs elsewhere (a Talk
  // dictation), leaving system audio untouched. Kept on the recorder for the
  // same reason as the compliance gate.
  private micMuteGainNode: GainNode | null = null;
  private micMuted = false;

  // PCM streaming configuration
  private transcriptOnly = false;
  private realtimeBufferMs = 0;
  private latencyHint: AudioContextLatencyCategory = "interactive";
  private pcmDataCallback: ((data: Float32Array) => void) | null = null;

  // PCM streaming worklet node
  private pcmWorkletNode: AudioWorkletNode | null = null;
  private pcmWorkletReady = false;
  /** When the current processor was installed; 0 when none is installed. */
  private pcmWorkletInstalledAt = 0;

  // PCM output-leg telemetry, measured on the worklet's 24kHz output —
  // after the DSP but before PCM16 conversion, buffering, and transport.
  // The analysers meter the graph BEFORE the worklet, so healthy
  // mic/system/mix levels with a dead pcmDb isolate a worklet/resample fault.
  // Level is the max over two rotating ~5s buckets (last 5–10s window).
  private pcmChunkCount = 0;
  private pcmBucketMaxDb = -Infinity;
  private pcmPrevBucketMaxDb = -Infinity;
  // Session-cumulative non-finite samples the worklet sanitized. Each worklet
  // reports its own per-instance count, so every generation is scored against
  // the session total captured when it was installed.
  private pcmNonFiniteCount = 0;
  // PCM-leg liveness. MediaRecorder chunks refresh the shared lastDataTime,
  // so a silenced worklet would never trip the general data-stall watchdog
  // when both pipelines run — this timestamp watches the PCM leg alone.
  private lastPcmChunkAt = 0;
  private lastEncodedChunkAt = 0;
  private encodedStallSince = 0;
  private encodedStallCount = 0;
  // Forced (cooldown-bypassing) rebuilds are rate-limited by their own clock:
  // a processor that crashes right after emitting a frame must not be able to
  // re-arm the bypass on every crash and rebuild in a tight loop.
  private lastForcedRecoveryAt = 0;
  // Bumped on every lifecycle transition that invalidates in-flight async
  // work (start/stop). Long recovery awaits (device open, MediaRecorder
  // flush) re-check this so a session torn down mid-recovery can never be
  // resurrected as an ownerless capture.
  private sessionGeneration = 0;
  private static readonly PCM_LEVEL_BUCKET_CHUNKS = 100; // ≈5s of 50ms frames
  private static readonly FORCED_RECOVERY_MIN_INTERVAL_MS = 60000;
  private trackMuteTimers = new Map<
    MediaStreamTrack,
    ReturnType<typeof setTimeout>
  >();
  private microphoneRecoveryInProgress = false;
  private lastMicrophoneRecoveryTime = 0;
  private systemRecoveryInProgress = false;
  private lastSystemRecoveryTime = 0;
  // Bumped on every completed mic-stream swap. An automatic re-acquire that
  // was in flight while another swap landed (e.g. the user switching devices
  // via switchInputDevice) must discard its stream instead of reverting the
  // newer swap.
  private micSwapGeneration = 0;

  // Stability monitoring: device-topology watching + dead-air detection
  private deviceWatcher: DeviceWatcher | null = null;
  private silenceTracker: SilenceTracker | null = null;
  private recoveryCounters = {
    microphone: 0,
    system: 0,
    graph: 0,
    deviceChange: 0,
  };

  // Amplitude-based mic activity detection
  private micAnalyserNode: AnalyserNode | null = null;
  private micAnalyserBuffer: Float32Array<ArrayBuffer> | null = null;
  private systemAnalyserNode: AnalyserNode | null = null;
  private systemAnalyserBuffer: Float32Array<ArrayBuffer> | null = null;
  private micActivityTimer: ReturnType<typeof setInterval> | null = null;
  private currentMicState: "on" | "off" = "off";
  private lastMicStateTimeSec = 0;
  private micStateConsecutiveCount = 0;
  private static readonly MIC_ACTIVE_THRESHOLD_DB = -30;
  private static readonly SYSTEM_ACTIVE_THRESHOLD_DB = -40;
  private static readonly MIC_DOMINANCE_DB = 6;
  /** System audio relative to the mic in the mix; the activity thresholds above assume it. */
  private static readonly SYSTEM_GAIN = 1.15;
  /** Slow-render episodes logged per session; the heartbeat counts the rest. */
  private static readonly MAX_LOGGED_CLOCK_EPISODES = 3;
  private static readonly MIC_ACTIVITY_INTERVAL_MS = 200;
  private static readonly MIC_ON_DEBOUNCE_COUNT = 2;
  private static readonly MIC_OFF_DEBOUNCE_COUNT = 15;
  private static readonly TRACK_MUTE_RECOVERY_MS = 10000;
  private static readonly TRACK_RESTART_COOLDOWN_MS = 30000;
  // devicechange is a real OS signal (debounced upstream), not flapping —
  // allow follow-up re-acquisition much sooner than the track-event cooldown.
  private static readonly DEVICE_CHANGE_REACQUIRE_COOLDOWN_MS = 5000;
  private static readonly SOURCE_RECOVERY_DATA_TIMEOUT_MS = 8000;
  private static readonly AUDIO_CONTEXT_DATA_TIMEOUT_MS = 10000;
  private static readonly AUDIO_CONTEXT_RECOVERY_ATTEMPTS = 3;
  private static readonly AUDIO_CONTEXT_RECOVERY_RETRY_MS = 500;
  private static readonly GRAPH_RESTART_COOLDOWN_MS = 30000;
  private static readonly GRAPH_RESTART_MAX_COOLDOWN_MS = 5 * 60 * 1000;
  private static readonly CONTEXT_CLOSE_TIMEOUT_MS = 2000;
  private static readonly WORKLET_READY_TIMEOUT_MS = 10000;

  constructor(
    sampleRate: number,
    private callbacks: AudioRecorderCallbacks = {},
    options?: {
      onEncodedChunk?: (data: Uint8Array) => void;
      onPCMChunk?: (data: Float32Array) => void;
      mediaMimeType?: string;
      mediaTimesliceMs?: number;
      enableSystemAudio?: boolean;
      /** Use CoreAudioTap (macOS 14.2+) for system audio - requires video:false */
      useCoreAudioTap?: boolean;
      /** Pre-captured system audio stream — bypasses getDisplayMedia (and Chromium self-exclusion) */
      systemAudioStreamOverride?: MediaStream;
      transcriptOnly?: boolean;
      realtimeBufferMs?: number;
      latencyHint?: AudioContextLatencyCategory;
    },
  ) {
    this.targetSampleRate = sampleRate;
    if (options?.onEncodedChunk)
      this.encodedDataCallback = options.onEncodedChunk;
    if (options?.onPCMChunk) this.pcmDataCallback = options.onPCMChunk;
    if (options?.mediaMimeType) this.mediaMimeType = options.mediaMimeType;
    if (options?.mediaTimesliceMs !== undefined)
      this.mediaTimesliceMs = options.mediaTimesliceMs;
    if (options?.enableSystemAudio)
      this.enableSystemAudio = options.enableSystemAudio;
    if (options?.useCoreAudioTap !== undefined)
      this.useCoreAudioTap = options.useCoreAudioTap;
    if (options?.systemAudioStreamOverride)
      this.systemAudioStreamOverride = options.systemAudioStreamOverride;
    if (options?.transcriptOnly !== undefined)
      this.transcriptOnly = options.transcriptOnly;
    if (options?.realtimeBufferMs !== undefined)
      this.realtimeBufferMs = options.realtimeBufferMs;
    if (options?.latencyHint) this.latencyHint = options.latencyHint;

    if (typeof document !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        this.onVisibilityChange,
        false,
      );
    }
  }

  // ========== Public API ==========

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error("Recording already in progress");
    }

    try {
      // Reset state
      this.isStopping = false;
      this.processedFrames = 0;
      this.accumulatedDurationMs = 0;
      this.startTimestampMs = Date.now();
      this.lastDataTime = Date.now();
      this.dataFlowSequence = 0;
      this.graphRecoveryAttemptsWithoutData = 0;
      this.clearDataFlowDeadline();
      this.pcmChunkCount = 0;
      this.pcmBucketMaxDb = -Infinity;
      this.pcmPrevBucketMaxDb = -Infinity;
      this.pcmNonFiniteCount = 0;
      this.lastPcmChunkAt = 0;
      this.lastEncodedChunkAt = 0;
      this.encodedStallSince = 0;
      this.encodedStallCount = 0;
      this.lastForcedRecoveryAt = 0;
      this.audioClockMonitor = new AudioClockMonitor();
      this.sessionGeneration++;

      // Create audio context
      await this.createAudioContext();

      // Get audio streams (mic and/or system audio)
      await this.getAudioStreams();

      // Setup audio processing graph
      await this.setupAudioGraph();

      // Start health monitoring
      this.startHealthMonitoring();
      this.startStabilityMonitoring();

      this.isRecording = true;
      this.isPaused = false;

      log.info("Recording started", {
        actualSampleRate: this.actualSampleRate,
        targetSampleRate: this.targetSampleRate,
        browser: this.browserInfo.userAgent,
      });
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  pauseRecording(): void {
    if (!this.isRecording || this.isPaused) return;

    try {
      if (this.startTimestampMs !== null) {
        this.accumulatedDurationMs += Date.now() - this.startTimestampMs;
        this.startTimestampMs = null;
      }

      this.isPaused = true;

      this.setAudioTracksEnabled(false);

      // Notify PCM worklet to pause processing
      if (this.pcmWorkletNode && this.pcmWorkletReady) {
        this.pcmWorkletNode.port.postMessage({ type: "pause", isPaused: true });
      }

      log.debug("Paused");
    } catch (error) {
      log.error("Failed to pause recording", { error: String(error) });
      throw error;
    }
  }

  resumeRecording(): void {
    if (!this.isRecording || !this.isPaused) return;

    try {
      this.isPaused = false;
      this.startTimestampMs = Date.now();

      // Re-enable the live audio tracks muted on pause.
      this.setAudioTracksEnabled(true);

      // Notify PCM worklet to resume processing
      if (this.pcmWorkletNode && this.pcmWorkletReady) {
        this.pcmWorkletNode.port.postMessage({
          type: "pause",
          isPaused: false,
        });
      }

      // Dead-air time must not span the pause, or a route that died before
      // a long pause would burst straight to a graph restart on resume.
      this.silenceTracker?.reset();

      // The worklet emitted nothing while paused — restart the PCM-leg
      // stall clock or a long pause reads as a stall on the first tick.
      if (this.lastPcmChunkAt > 0) this.lastPcmChunkAt = Date.now();
      if (this.lastEncodedChunkAt > 0) this.lastEncodedChunkAt = Date.now();

      void this.ensureAudioContextRunning();

      log.debug("Resumed");
    } catch (error) {
      log.error("Failed to resume recording", { error: String(error) });
      throw error;
    }
  }

  /**
   * Mute freshly installed tracks if the session is paused.
   *
   * Every path that acquires a stream — graph rebuild, mic re-acquisition,
   * a device switch from the dropdown — hands back an ENABLED track, and the
   * user can pause during the getUserMedia await. Downstream consumers are
   * not a safety net: MediaRecorder is started by setupAudioGraph() before
   * the worklet finishes loading, so audio captured in that window is
   * encoded and delivered. Muting the tracks is what actually stops capture.
   */
  private applyPauseStateToStreams(): void {
    if (!this.isPaused) return;
    this.setAudioTracksEnabled(false);
    log.debug("Applied pause state to newly acquired tracks");
  }

  // Enable/disable the live mic + system audio tracks. Disabled tracks emit
  // silence, so paused audio is never captured by any downstream path.
  private setAudioTracksEnabled(enabled: boolean): void {
    for (const stream of [
      this.mediaStream,
      this.micStream,
      this.systemStream,
    ]) {
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) return;

    // Mark as intentionally stopping BEFORE any cleanup, and invalidate any
    // recovery already awaiting a device or MediaRecorder flush so it can't
    // rebuild capture behind the stop.
    this.isStopping = true;
    this.sessionGeneration++;

    if (this.startTimestampMs !== null) {
      this.accumulatedDurationMs += Date.now() - this.startTimestampMs;
      this.startTimestampMs = null;
    }

    this.isRecording = false;
    this.isPaused = false;

    this.stopHealthMonitoring();

    // Stop MediaRecorder first to flush final chunk
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        const mr = this.mediaRecorder;

        await new Promise<void>((resolve) => {
          let dataReceived = false;
          const timeout = setTimeout(() => {
            if (!dataReceived) {
              log.warn(
                "No data received after requestData(), continuing with stop",
              );
            }
            resolve();
          }, 2000); // 2 second timeout

          const onDataAvailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              dataReceived = true;
              log.debug("Final chunk received on stop", {
                size: event.data.size,
              });
            }
          };

          const onStop = () => {
            clearTimeout(timeout);
            mr.onstop = null;
            mr.removeEventListener("dataavailable", onDataAvailable);
            log.debug("MediaRecorder stopped", {
              finalDataReceived: dataReceived,
            });
            resolve();
          };

          mr.onstop = onStop;
          mr.addEventListener("dataavailable", onDataAvailable);

          // Request any buffered data before stopping
          try {
            mr.requestData();
            log.debug("requestData() called");
          } catch (e) {
            log.warn("MediaRecorder requestData error", {
              error: e instanceof Error ? e.message : String(e),
            });
          }

          // Small delay to ensure requestData() is processed
          setTimeout(() => {
            try {
              mr.stop();
              log.debug("stop() called");
            } catch (e) {
              log.warn("MediaRecorder stop error", {
                error: e instanceof Error ? e.message : String(e),
              });
              clearTimeout(timeout);
              resolve();
            }
          }, 100); // 100ms delay between requestData() and stop()
        });
      }
    } catch (e) {
      log.warn("MediaRecorder stop error", {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    log.info("Stopped", {
      duration: `${this.getCurrentDuration().toFixed(1)}s`,
      processedFrames: this.processedFrames,
    });

    await this.cleanup();
  }

  getCurrentDuration(): number {
    const runningDelta =
      this.isRecording && !this.isPaused && this.startTimestampMs !== null
        ? Date.now() - this.startTimestampMs
        : 0;
    return (this.accumulatedDurationMs + runningDelta) / 1000;
  }

  getCurrentMeter(): number {
    return this.currentMeterValue;
  }

  getActualSampleRate(): number {
    return this.actualSampleRate;
  }

  getAudioContextState(): string {
    return this.audioContext?.state ?? "closed";
  }

  /** Current mic input level in dB (or -Infinity if no analyser). */
  getMicDb(): number {
    if (!this.micAnalyserNode || !this.micAnalyserBuffer) return -Infinity;
    return this.computeRmsDb(this.micAnalyserNode, this.micAnalyserBuffer);
  }

  /** Current system audio level in dB (or -Infinity if not captured). */
  getSystemDb(): number {
    if (!this.systemAnalyserNode || !this.systemAnalyserBuffer)
      return -Infinity;
    return this.computeRmsDb(
      this.systemAnalyserNode,
      this.systemAnalyserBuffer,
    );
  }

  /** Seconds since the last encoded or PCM chunk moved through the recorder. */
  getSilenceDurationSec(): number {
    return (Date.now() - this.lastDataTime) / 1000;
  }

  async ensureAudioContextRunning(): Promise<void> {
    const context = this.audioContext;
    if (!context || context.state === "closed") return;

    const state = context.state as string;
    if (state === "running") return;
    if (state !== "suspended" && state !== "interrupted") {
      log.warn("AudioContext is in an unexpected non-running state", { state });
      return;
    }
    this.scheduleDataFlowDeadline(
      `AudioContext ${state}`,
      this.getRecoveryDataTimeoutMs(
        AudioRecorder.AUDIO_CONTEXT_DATA_TIMEOUT_MS,
      ),
    );
    if (this.audioContextRecoveryInProgress) return;

    this.audioContextRecoveryInProgress = true;
    log.warn("Recovering non-running AudioContext", { state });

    try {
      // context.state changes across the awaits below; read it through a
      // function so TS doesn't pin the pre-await narrowing.
      const currentState = (): string => context.state;
      for (
        let attempt = 1;
        attempt <= AudioRecorder.AUDIO_CONTEXT_RECOVERY_ATTEMPTS;
        attempt++
      ) {
        if (currentState() === "running" || currentState() === "closed") break;

        try {
          await context.resume();
        } catch (error) {
          log.warn("AudioContext resume attempt failed", {
            attempt,
            state: context.state,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        if (currentState() === "running" || currentState() === "closed") break;
        await this.delay(AudioRecorder.AUDIO_CONTEXT_RECOVERY_RETRY_MS);
      }

      if (context.state === "running") {
        log.info("AudioContext recovered", { state: context.state });
      } else {
        log.error("AudioContext recovery did not reach running state", {
          state: context.state,
        });
        this.callbacks.onRecoveryLog?.(
          `Audio context recovery failed; state is ${context.state}.`,
        );
      }
    } finally {
      this.audioContextRecoveryInProgress = false;
    }
  }

  // ========== Internal Methods ==========

  private detectBrowser(): BrowserInfo {
    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
    return {
      isFirefox: ua.includes("firefox"),
      isSafari: ua.includes("safari") && !ua.includes("chrome"),
      isChrome: ua.includes("chrome") && !ua.includes("edg"),
      isIOS: /ipad|iphone|ipod/.test(ua),
      userAgent: ua,
    };
  }

  private async createAudioContext(): Promise<void> {
    try {
      // Use hardware sample rate for best battery efficiency
      // Forcing sample rate causes resampling = more CPU usage
      //
      // Rendering deliberately stays on the default output device although
      // nothing audible is played: its hardware clock paces the whole graph.
      // Do not route it to the silent sink (setSinkId({type: "none"})) — that
      // sink is paced by a timer, and Windows 11 coarsens a minimized app's
      // timer to 15.6 ms ticks, so the graph renders ~64% of real time and a
      // third of the captured audio is dropped.
      this.audioContext = new AudioContext({
        // The device buffer is the render thread's deadline per callback:
        // "interactive" gives 10 ms on Windows, "playback" 20 ms. Nothing is
        // played, so the added latency costs nothing, while a missed deadline
        // drops captured audio. The longer deadline is rolled out by flag.
        latencyHint: this.latencyHint,
      });

      this.actualSampleRate = this.audioContext.sampleRate;
      this.audioContext.onstatechange = () => {
        const state = this.audioContext?.state as string | undefined;
        log.info("AudioContext state changed", { state });
        // A suspend and resume between two clock readings would otherwise
        // read as slow rendering.
        if (state !== "running") this.audioClockMonitor.reset();

        if (
          this.isRecording &&
          !this.isPaused &&
          (state === "suspended" || state === "interrupted")
        ) {
          void this.ensureAudioContextRunning();
        }
      };

      await this.ensureAudioContextRunning();

      log.info("AudioContext created", {
        actualRate: this.actualSampleRate,
        targetRate: this.targetSampleRate,
        usingHardwareRate: true,
        latencyHint: this.latencyHint,
        baseLatency: this.audioContext.baseLatency,
      });
    } catch (error) {
      log.error("Failed to create AudioContext", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get audio streams based on configuration.
   *
   * Mic is acquired FIRST, then onMicReady fires (so callers can serialize
   * loopback enable after we already hold the mic endpoint — avoids races on
   * Windows 11 25H2 where installing the loopback handler before the mic
   * trips NotReadableError on the mic open), then system audio is acquired.
   *
   * If onMicReady returns null/throws, or if system audio acquisition fails,
   * we degrade to mic-only instead of killing the whole session.
   */
  private async getAudioStreams(): Promise<void> {
    const generation = this.sessionGeneration;

    if (!this.enableSystemAudio) {
      this.mediaStream = await this.getUserMedia(false);
      return;
    }

    log.debug("Capturing both mic and system audio for mixing");

    // 1) Mic first.
    this.micStream = await this.getUserMedia(false);

    // The mic open can park for a long time (device open, permission prompt).
    // Unlike everything else here, onMicReady installs state OUTSIDE this
    // recorder — Electron's process-wide display-media handler — and the
    // caller's cancellation check only tears down streams. So a session that
    // ended while the mic was opening must not run the hook at all: nothing
    // would be left to disable the handler it installs.
    if (generation !== this.sessionGeneration || this.isStopping) {
      log.warn("Session ended during mic acquisition; skipping system audio", {
        generation,
        currentGeneration: this.sessionGeneration,
      });
      this.demoteToMicOnly();
      return;
    }

    // 2) Post-mic hook (e.g., enable loopback handler on the main process).
    //    Track whether the hook ran to completion — only in that case is
    //    onSystemAudioUnavailable allowed to fire (the caller installed
    //    state that needs tearing down).
    let skipSystemAudio = false;
    let micReadySucceeded = false;
    if (this.callbacks.onMicReady) {
      try {
        const result = await this.callbacks.onMicReady();
        if (result === null) {
          skipSystemAudio = true;
        } else {
          micReadySucceeded = true;
          if (
            result &&
            typeof (result as { useCoreAudioTap?: boolean }).useCoreAudioTap ===
              "boolean"
          ) {
            this.useCoreAudioTap = (
              result as { useCoreAudioTap: boolean }
            ).useCoreAudioTap;
          }
        }
      } catch (error) {
        log.warn("onMicReady callback failed; continuing mic-only", {
          error: error instanceof Error ? error.message : String(error),
        });
        skipSystemAudio = true;
      }
    } else {
      // No hook configured — nothing to tear down, but proceed to system
      // audio attempt.
      micReadySucceeded = true;
    }

    if (skipSystemAudio) {
      this.demoteToMicOnly();
      return;
    }

    // onMicReady awaits IPC of its own, so the session can end inside it too.
    // Stopping here matters more than at the previous checkpoint: the system
    // capture below can FAIL, and its failure path calls back out to disable
    // the loopback handler — which is process-global, so a dead session's
    // late failure would strip system audio from whichever session is live.
    if (generation !== this.sessionGeneration || this.isStopping) {
      log.warn("Session ended while enabling system audio; skipping capture", {
        generation,
        currentGeneration: this.sessionGeneration,
      });
      this.demoteToMicOnly();
      return;
    }

    // 3) System audio. If this fails the mic is still good — degrade
    //    rather than aborting the whole session. When onMicReady succeeded
    //    (i.e., the caller installed a loopback handler), notify the
    //    caller so it can tear that handler down immediately instead of
    //    leaving it live for the rest of the mic-only session.
    try {
      this.systemStream = await this.getUserMedia(true);
    } catch (error) {
      log.warn("System audio capture failed; degrading to mic-only", {
        name: error instanceof DOMException ? error.name : "",
        error: error instanceof Error ? error.message : String(error),
      });
      this.callbacks.onRecoveryLog?.(
        "System audio unavailable — recording with microphone only.",
      );
      if (micReadySucceeded && this.callbacks.onSystemAudioUnavailable) {
        try {
          await this.callbacks.onSystemAudioUnavailable();
        } catch (cleanupError) {
          log.warn("onSystemAudioUnavailable callback failed", {
            error:
              cleanupError instanceof Error
                ? cleanupError.message
                : String(cleanupError),
          });
        }
      }
      this.demoteToMicOnly();
      return;
    }

    log.debug("Both audio streams obtained, will be mixed");
  }

  // Convert a partially-initialized mixed-capture state into a clean
  // mic-only state. Idempotent.
  private demoteToMicOnly(): void {
    if (!this.micStream) return;
    this.enableSystemAudio = false;
    this.mediaStream = this.micStream;
    this.micStream = null;
    log.info("Recording will continue with microphone only");
  }

  private async getUserMedia(systemAudio: boolean): Promise<MediaStream> {
    if (systemAudio) {
      // If a pre-captured stream was provided, use it directly
      // (bypasses Chromium's excludesCurrentProcessAudio:YES for self-app audio)
      if (this.systemAudioStreamOverride) {
        log.debug(
          "Using system audio stream override (bypassing getDisplayMedia)",
        );
        return this.systemAudioStreamOverride;
      }

      // CoreAudioTap (macOS 14.2+) uses video:false - it's audio-only and doesn't need video
      // ScreenCaptureKit (older macOS) requires video:true initially
      const needsVideo = !this.useCoreAudioTap;

      log.debug("Using getDisplayMedia for system audio capture", {
        useCoreAudioTap: this.useCoreAudioTap,
        needsVideo,
      });

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: needsVideo,
          audio: true,
        });

        if (needsVideo) {
          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach((track) => {
            track.stop();
            stream.removeTrack(track);
          });
          log.debug("System audio stream obtained, video tracks removed");
        } else {
          log.debug("System audio stream obtained (CoreAudioTap, no video)");
        }

        return stream;
      } catch (error) {
        log.error("getDisplayMedia (system audio) failed", {
          name: error instanceof DOMException ? error.name : "",
          error: error instanceof Error ? error.message : String(error),
        });
        await this.logAudioDevices("getDisplayMedia failed");
        throw error;
      }
    }

    return await this.getMicrophoneStream();
  }

  /**
   * Build mic getUserMedia constraints, disabling echo cancellation for
   * mic-only capture.
   *
   * Chrome's echo canceller references the browser's audio render — which
   * includes audio playing in OTHER tabs. On headphones (no real echo to
   * cancel) its adaptive filter treats that reference as echo and
   * over-suppresses the mic to silence while the other tab plays, restoring
   * it only when that audio stops. We turn AEC off when capturing the mic
   * alone.
   *
   * We keep AEC on for mixed capture (enableSystemAudio): there the mic
   * deliberately shares a room with system audio we also capture via
   * loopback/getDisplayMedia, and AEC removes the speaker bleed that would
   * otherwise record that audio twice (clean loopback + delayed mic echo).
   *
   * echoCancellation:false is advisory (not `{exact}`), so it never throws
   * OverconstrainedError and won't disturb the driver fallbacks below. AGC
   * and noise suppression are left at browser defaults either way.
   */
  private buildMicConstraints(deviceId?: string): MediaStreamConstraints {
    const audio: MediaTrackConstraints = {};
    if (deviceId) audio.deviceId = { exact: deviceId };
    if (!this.enableSystemAudio) audio.echoCancellation = false;
    // No constraints at all → truly bare {audio:true} for max driver compat.
    return { audio: Object.keys(audio).length > 0 ? audio : true };
  }

  /**
   * All processing off. With every processing constraint disabled, Chromium
   * opens the Windows capture in RAW mode (AUDCLNT_STREAMOPTIONS_RAW —
   * feature WASAPIRawAudioCapture), bypassing driver/OEM enhancement APOs
   * (Voice Focus, Waves, Dolby …) that can gate a healthy mic to silence.
   * Chrome-side AEC/NS/AGC are lost too, so this is a recovery fallback
   * only — speaker bleed in the recording beats no user audio at all, and
   * this path only runs after the processed stream measured dead.
   */
  private buildUnprocessedMicConstraints(
    deviceId?: string,
  ): MediaStreamConstraints {
    const audio: MediaTrackConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    };
    if (deviceId) audio.deviceId = { exact: deviceId };
    return { audio };
  }

  /**
   * Acquire a microphone stream with forgiving, layered fallbacks.
   *
   * Strategy (in order):
   *   1. Minimal constraints on the default device (see buildMicConstraints):
   *      echoCancellation is pinned false for mic-only capture, AGC/noise
   *      suppression are left to the browser. Nothing is pinned with
   *      `{exact}`, so drivers (notably Windows 11 25H2 ones) have nothing
   *      to reject.
   *   2. On NotReadableError/AbortError only: 400 ms backoff + one retry of
   *      attempt 1. Another app (Teams/Zoom/voice assistants) commonly
   *      releases the endpoint within this window.
   *   3. Iterate explicit audioinput deviceIds (same constraint policy).
   *      "default" sometimes resolves to a stuck endpoint while a sibling
   *      device works.
   *
   * No channelCount constraint anywhere — stereo input is downmixed to mono
   * by the audio graph downstream.
   *
   * The device list is snapshotted on every failure path so the long tail
   * of "Could not start audio source" reports is diagnosable. The first and
   * last (terminal) errors are both kept for diagnostics.
   *
   * Throws MicrophoneAcquisitionError with a classified code on terminal
   * failure.
   */
  private async getMicrophoneStream(): Promise<MediaStream> {
    // Track first and most-recent failures separately. firstError is the
    // failure tied to the user's primary input; terminalError is whatever
    // ultimately exhausted our fallbacks. They're often the same but can
    // diverge (e.g., NotReadableError on default → OverconstrainedError on
    // explicit deviceId) and the divergence is itself a diagnostic signal.
    let firstError: unknown;
    let terminalError: unknown;

    const recordFailure = (error: unknown, stage: string): void => {
      if (firstError === undefined) firstError = error;
      terminalError = error;
      log.warn(`Mic getUserMedia ${stage} failed`, {
        name: error instanceof DOMException ? error.name : "",
        message: error instanceof Error ? error.message : String(error),
      });
    };

    // Attempt 1: minimal constraints. Maximum driver compatibility.
    try {
      log.debug("Mic getUserMedia attempt: bare", {
        disableAec: !this.enableSystemAudio,
      });
      return await navigator.mediaDevices.getUserMedia(
        this.buildMicConstraints(this.preferredDeviceId),
      );
    } catch (error) {
      recordFailure(error, "attempt 1 (bare)");
      await this.logAudioDevices("mic attempt 1 failed");

      // Permission errors are terminal — no retry will help.
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        const classified = classifyMediaError(error);
        throw new MicrophoneAcquisitionError(
          classified.code,
          classified.message,
          name,
        );
      }
    }

    // Attempt 2: short backoff + retry of the bare request (only for
    // transient exclusive locks).
    const firstName = firstError instanceof DOMException ? firstError.name : "";
    if (firstName === "NotReadableError" || firstName === "AbortError") {
      await sleep(400);
      try {
        log.debug("Mic getUserMedia attempt: bare-retry");
        return await navigator.mediaDevices.getUserMedia(
          this.buildMicConstraints(),
        );
      } catch (retryError) {
        recordFailure(retryError, "attempt 2 (bare-retry)");
      }
    }

    // Attempt 3: iterate explicit deviceIds. Same constraint policy as the
    // bare attempts (a deviceId pin plus the mic-only AEC flag), since
    // "default" can resolve to a stuck endpoint while a sibling device works.
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter(
        (d) =>
          d.kind === "audioinput" &&
          d.deviceId &&
          d.deviceId !== "default" &&
          d.deviceId !== "communications",
      );

      for (const input of inputs) {
        try {
          log.debug("Mic getUserMedia attempt: explicit deviceId", {
            deviceId: `${input.deviceId.slice(0, 8)}…`,
            label: input.label,
          });
          return await navigator.mediaDevices.getUserMedia(
            this.buildMicConstraints(input.deviceId),
          );
        } catch (devError) {
          recordFailure(
            devError,
            `attempt 3 (deviceId ${input.deviceId.slice(0, 8)}…)`,
          );
        }
      }
    } catch (enumError) {
      log.warn("enumerateDevices failed during mic fallback", {
        error:
          enumError instanceof Error ? enumError.message : String(enumError),
      });
    }

    // All attempts exhausted. firstError is the failure on the user's
    // primary device — that's the most informative thing to surface in the
    // user-facing classified message. terminalError may differ and is
    // logged for diagnostics.
    await this.logAudioDevices("all mic attempts exhausted");
    const classified = classifyMediaError(firstError);
    const firstName2 =
      firstError instanceof DOMException ? firstError.name : "";
    const terminalName =
      terminalError instanceof DOMException ? terminalError.name : "";
    log.error("Microphone acquisition exhausted all fallbacks", {
      firstName: firstName2,
      firstMessage:
        firstError instanceof Error ? firstError.message : String(firstError),
      terminalName,
      terminalMessage:
        terminalError instanceof Error
          ? terminalError.message
          : String(terminalError),
      divergedFromFirst: terminalError !== firstError,
    });
    throw new MicrophoneAcquisitionError(
      classified.code,
      classified.message,
      firstName2 || undefined,
    );
  }

  // Snapshot of the current audio device list for diagnostics. Used on every
  // mic-acquisition failure path so we can tell whether the default device
  // disappeared mid-session (common on Bluetooth/USB churn).
  private async logAudioDevices(stage: string): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const summary = devices.map((d) => ({
        kind: d.kind,
        label: d.label || "(label hidden — no permission)",
        deviceId:
          d.deviceId === "default" ||
          d.deviceId === "communications" ||
          !d.deviceId
            ? d.deviceId
            : `${d.deviceId.slice(0, 8)}…`,
        groupId: d.groupId ? `${d.groupId.slice(0, 8)}…` : "",
      }));
      const inputs = summary.filter((d) => d.kind === "audioinput");
      log.info("Audio device snapshot", {
        stage,
        audioInputCount: inputs.length,
        devices: summary,
      });
    } catch (error) {
      log.warn("enumerateDevices failed", {
        stage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async setupAudioGraph(): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }

    // Check if we need to mix two audio sources
    const needsMixing = this.micStream && this.systemStream;

    if (needsMixing) {
      // Mix mic and system audio into mono
      await this.setupMixedAudioGraph();
    } else if (this.mediaStream) {
      // Single source (either mic or system audio)
      await this.setupSingleSourceGraph();
    } else {
      throw new Error("No audio streams available");
    }
  }

  /**
   * Setup audio graph for mixing mic and system audio into mono PCM.
   * Based on the approach from https://github.com/alectrocute/mic-speaker-streamer
   */
  private async setupMixedAudioGraph(): Promise<void> {
    if (!this.audioContext || !this.micStream || !this.systemStream) {
      throw new Error("AudioContext or streams not initialized for mixing");
    }

    log.debug("Setting up mixed audio graph (mic + system)");

    // Create source nodes
    this.micSourceNode = this.audioContext.createMediaStreamSource(
      this.micStream,
    );
    this.systemSourceNode = this.audioContext.createMediaStreamSource(
      this.systemStream,
    );
    const micSource = this.micSourceNode;
    const systemSource = this.systemSourceNode;

    // Log stream info for debugging
    const micTrack = this.micStream.getAudioTracks()[0];
    const sysTrack = this.systemStream.getAudioTracks()[0];
    log.debug("Mic track settings:", micTrack?.getSettings());
    log.debug("System track settings:", sysTrack?.getSettings());

    // Per-source gain so we can balance mic/system independently.
    // channelInterpretation: "speakers" performs a proper L+R → mean(L,R)
    // downmix when the mic delivers stereo. Mono input passes through
    // unchanged. (Previously "discrete", which silently dropped the right
    // channel of stereo mics.)
    const micGain = this.audioContext.createGain();
    this.micGainNode = micGain;
    micGain.channelCount = 1;
    micGain.channelCountMode = "explicit";
    micGain.channelInterpretation = "speakers";
    micGain.gain.value = 1.0;

    // Loopback delivers stereo. "speakers" averages L and R into the mono
    // branch, and the doubled gain restores the L+R sum the graph has always
    // produced, so levels downstream are unchanged. Mono loopback (some
    // Bluetooth endpoints) passes through at the base gain.
    const systemGain = this.audioContext.createGain();
    this.systemGainNode = systemGain;
    systemGain.channelCount = 1;
    systemGain.channelCountMode = "explicit";
    systemGain.channelInterpretation = "speakers";
    const systemChannelCount = sysTrack?.getSettings()?.channelCount ?? 2;
    systemGain.gain.value =
      systemChannelCount > 1
        ? AudioRecorder.SYSTEM_GAIN * 2
        : AudioRecorder.SYSTEM_GAIN;
    systemSource.connect(systemGain);
    this.systemSourceTargets = [systemGain];

    // Mono mix bus. Deliberately no limiter: the DynamicsCompressor spent a
    // transcendental per sample on machines that already render below real
    // time, and the sum rarely exceeds full scale; the PCM16 converter clamps
    // when it does.
    const mixBus = this.audioContext.createGain();
    mixBus.channelCount = 1;
    mixBus.channelCountMode = "explicit";
    mixBus.channelInterpretation = "discrete";
    mixBus.gain.value = 1.0;

    // Connect mic (already mono)
    micSource.connect(micGain);
    const mic = this.gateMicrophone(micGain);

    // Sum mic + system into a mono bus
    mic.connect(mixBus);
    systemGain.connect(mixBus);

    // Separate analysers for amplitude-based mic activity detection
    this.micAnalyserNode = this.audioContext.createAnalyser();
    this.micAnalyserNode.fftSize = 2048;
    this.micAnalyserNode.smoothingTimeConstant = 0.8;
    mic.connect(this.micAnalyserNode);
    this.micAnalyserBuffer = new Float32Array(
      Number(this.micAnalyserNode.fftSize),
    );

    this.systemAnalyserNode = this.audioContext.createAnalyser();
    this.systemAnalyserNode.fftSize = 2048;
    this.systemAnalyserNode.smoothingTimeConstant = 0.8;
    systemGain.connect(this.systemAnalyserNode);
    this.systemAnalyserBuffer = new Float32Array(
      Number(this.systemAnalyserNode.fftSize),
    );

    // Setup track monitoring for both streams
    this.setupTrackMonitoring();

    const recordable = this.gateRecordingOutput(mixBus);

    // Build destination for MediaRecorder (if not transcriptOnly)
    if (!this.transcriptOnly) {
      this.mediaDestination = this.audioContext.createMediaStreamDestination();
      recordable.connect(this.mediaDestination);
      this.setupMediaRecorder();
    }

    // Keep graph alive: connect silent gain to destination
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;
    mixBus.connect(gain);
    gain.connect(this.audioContext.destination);

    // Setup analyser for metering
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.9;
    mixBus.connect(this.analyserNode);
    this.analyserBuffer = new Float32Array(Number(this.analyserNode.fftSize));
    this.startMetering();

    // Setup PCM streaming if callback is provided (for backend streaming)
    if (this.pcmDataCallback) {
      await this.setupPCMStreaming(recordable);
    }

    this.startMicActivityMonitoring();

    log.debug("Mixed audio graph setup complete");
  }

  /**
   * Setup audio graph for single source (backwards compatibility).
   *
   * A mono-normalizer GainNode sits between the source and every downstream
   * consumer. It does the stereo→mono downmix automatically (via
   * channelInterpretation: "speakers") so we can drop the mic channelCount
   * constraint and still emit mono encoded/PCM. On microphone swap (recovery)
   * the new source only needs to reconnect to the normalizer — the rest of
   * the graph stays wired up.
   */
  private async setupSingleSourceGraph(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error("AudioContext or MediaStream not initialized");
    }

    // Create source node
    this.sourceNode = this.audioContext.createMediaStreamSource(
      this.mediaStream,
    );

    // Mono normalizer: forces single-channel output. "speakers" mode does
    // proper L+R → mean(L,R) downmix when the mic delivers stereo. Mono
    // input passes through unchanged.
    const monoNormalizer = this.audioContext.createGain();
    monoNormalizer.channelCount = 1;
    monoNormalizer.channelCountMode = "explicit";
    monoNormalizer.channelInterpretation = "speakers";
    monoNormalizer.gain.value = 1.0;
    this.sourceNode.connect(monoNormalizer);

    // Recovery rebuilds source → singleSourceTargets[i] for each entry.
    // Only the normalizer needs to be in that list; downstream nodes stay
    // attached to the normalizer across mic swaps.
    this.singleSourceTargets = [monoNormalizer];
    const mic = this.gateMicrophone(monoNormalizer);

    // Setup track monitoring
    this.setupTrackMonitoring();

    const recordable = this.gateRecordingOutput(mic);

    // Build destination for MediaRecorder (if not transcriptOnly)
    if (!this.transcriptOnly) {
      this.mediaDestination = this.audioContext.createMediaStreamDestination();
      recordable.connect(this.mediaDestination);
      this.setupMediaRecorder();
    }

    // Keep graph alive: connect silent gain to destination
    this.sourceKeepAliveNode = this.audioContext.createGain();
    this.sourceKeepAliveNode.gain.value = 0;
    mic.connect(this.sourceKeepAliveNode);
    this.sourceKeepAliveNode.connect(this.audioContext.destination);

    // Setup analyser for metering
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.9;
    mic.connect(this.analyserNode);
    this.analyserBuffer = new Float32Array(Number(this.analyserNode.fftSize));
    this.startMetering();

    // Setup PCM streaming if callback is provided (for backend streaming)
    if (this.pcmDataCallback) {
      await this.setupPCMStreaming(recordable);
    }
  }

  /**
   * Setup PCM streaming using AudioWorkletNode.
   * This extracts raw PCM data for backend streaming with adjustable buffering.
   * Resamples audio from native sample rate (e.g., 48kHz) to 24kHz for backend.
   * Buffers audio data based on realtimeBufferMs setting.
   *
   * IMPORTANT: AudioWorklet requires a secure context (HTTPS or localhost).
   * The worklet handles resampling in the audio thread and sends PCM data
   * via MessagePort using transferable Float32Arrays for zero-copy performance.
   */
  private async setupPCMStreaming(sourceNode: AudioNode): Promise<void> {
    if (!this.audioContext) return;

    const TARGET_SAMPLE_RATE = 24000;
    const resampleRatio = this.actualSampleRate / TARGET_SAMPLE_RATE;

    log.debug("Setting up PCM streaming with AudioWorklet", {
      bufferMs: this.realtimeBufferMs,
      sourceSampleRate: this.actualSampleRate,
      targetSampleRate: TARGET_SAMPLE_RATE,
      resampleRatio: resampleRatio.toFixed(2),
    });

    // Load the AudioWorklet module from inline code using Blob URL
    // This avoids separate file requests and works with bundlers
    const workletBlob = new Blob([PCM_STREAMING_WORKLET_CODE], {
      type: "application/javascript",
    });
    const workletUrl = URL.createObjectURL(workletBlob);

    try {
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } catch (error) {
      log.error("Failed to load PCM worklet", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        "Failed to load AudioWorklet. Ensure you are in a secure context (HTTPS or localhost).",
      );
    } finally {
      // Clean up the blob URL after the module is loaded
      URL.revokeObjectURL(workletUrl);
    }

    // Create the AudioWorkletNode with channel configuration
    this.pcmWorkletNode = new AudioWorkletNode(
      this.audioContext,
      "pcm-streaming-processor",
      {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        channelCountMode: "explicit",
        channelInterpretation: "discrete",
        outputChannelCount: [1],
        processorOptions: {
          resampleRatio,
          sourceSampleRate: this.actualSampleRate,
        },
      },
    );

    // Watched by the health tick: a processor that never reports ready is as
    // silent as one that stalled, and the ready flag gates that check.
    this.pcmWorkletInstalledAt = Date.now();

    // Track buffered audio on main thread (at target 24kHz rate)
    let audioBuffer: Float32Array[] = [];
    let bufferDurationMs = 0;
    const targetBufferMs =
      this.realtimeBufferMs > 0 ? this.realtimeBufferMs : 0;

    // Drop the previous generation's level buckets so its levels can't
    // contaminate telemetry measured on the new graph.
    this.pcmChunkCount = 0;
    this.pcmBucketMaxDb = -Infinity;
    this.pcmPrevBucketMaxDb = -Infinity;

    // Pin this worklet generation: a torn-down worklet's port can still
    // deliver queued messages (and fire processorerror) after a rebuild has
    // installed its successor — those must not touch current-generation state.
    const workletGeneration = this.pcmWorkletNode;
    // Highest fault total THIS worklet has reported. Each worklet counts from
    // zero, so the session total accumulates per-generation deltas: a shared
    // baseline plus max() would silently drop a retired worklet's tail once
    // its successor had reported faults of its own.
    let generationNonFiniteReported = 0;

    // Handle messages from the worklet
    this.pcmWorkletNode.port.onmessage = (event: MessageEvent) => {
      const { type, samples, sampleCount, nonFiniteCount } = event.data;

      // Fault telemetry is consumed BEFORE the generation and delivery
      // guards: the worklet's final partial flush lands during teardown
      // (after the node is detached and isRecording is already false), and
      // those faults are exactly the ones worth knowing about. Only the
      // increment is added, so out-of-order or duplicate messages can't
      // inflate the total.
      if (
        typeof nonFiniteCount === "number" &&
        nonFiniteCount > generationNonFiniteReported
      ) {
        this.pcmNonFiniteCount += nonFiniteCount - generationNonFiniteReported;
        generationNonFiniteReported = nonFiniteCount;
      }

      if (this.pcmWorkletNode !== workletGeneration) return;

      if (type === "ready") {
        this.pcmWorkletReady = true;
        // Grace period: the PCM-stall watchdog measures from here, not from
        // a previous generation's last chunk.
        this.lastPcmChunkAt = Date.now();
        // A processor installed by a rebuild starts unpaused and can only be
        // told otherwise once it is ready, which is after the rebuild that
        // would have paused it has already returned.
        if (this.isPaused) {
          this.pcmWorkletNode?.port.postMessage({
            type: "pause",
            isPaused: true,
          });
        }
        log.debug("PCM worklet ready");
        return;
      }

      if (type === "dspAnomaly") {
        // Count already consumed above; this message only exists to surface
        // the fault promptly (pcmData carries the exact running total).
        log.warn("PCM worklet sanitized non-finite samples", {
          sessionCount: this.pcmNonFiniteCount,
        });
        return;
      }

      if (type === "pcmData") {
        if (!this.isRecording || this.isPaused) return;

        this.markDataFlow();
        this.lastPcmChunkAt = Date.now();

        // samples is a Float32Array transferred from the worklet
        const resampled = samples as Float32Array;
        this.trackPcmLevel(resampled);

        if (targetBufferMs === 0 || targetBufferMs === -1) {
          // No buffering - send immediately (default for non-realtime streaming)
          this.pcmDataCallback?.(resampled);
        } else {
          // Buffer audio until we reach target duration (for realtime transcription)
          audioBuffer.push(resampled);
          const chunkDurationMs = (sampleCount / TARGET_SAMPLE_RATE) * 1000;
          bufferDurationMs += chunkDurationMs;

          if (bufferDurationMs >= targetBufferMs) {
            // Concatenate buffered chunks
            const totalLength = audioBuffer.reduce(
              (sum, arr) => sum + arr.length,
              0,
            );
            const combined = new Float32Array(totalLength);
            let offset = 0;
            for (const arr of audioBuffer) {
              combined.set(arr, offset);
              offset += arr.length;
            }

            // Send buffered audio
            this.pcmDataCallback?.(combined);

            // Reset buffer
            audioBuffer = [];
            bufferDurationMs = 0;
          }
        }
      }
    };

    // Handle worklet errors
    this.pcmWorkletNode.port.onmessageerror = () => {
      if (this.pcmWorkletNode !== workletGeneration) return;
      log.error("PCM worklet message deserialization error");
    };

    // An unhandled exception in process() is unrecoverable: per spec the
    // processor outputs silence for the rest of its lifetime — so this
    // bypasses the recovery cooldown instead of waiting out a ladder built
    // for transient stalls. The bypass has its own clock (not "did a frame
    // arrive"): a processor that crashes right after emitting one frame
    // would otherwise re-arm it on every crash and rebuild in a tight loop.
    this.pcmWorkletNode.onprocessorerror = (event) => {
      if (this.pcmWorkletNode !== workletGeneration) return;
      const message =
        event instanceof ErrorEvent && event.message
          ? event.message
          : "PCM worklet processor crashed";
      log.error("PCM worklet processor error", { message });
      this.callbacks.onWorkletError?.(message);

      const now = Date.now();
      const force =
        now - this.lastForcedRecoveryAt >=
        AudioRecorder.FORCED_RECOVERY_MIN_INTERVAL_MS;
      if (force) this.lastForcedRecoveryAt = now;
      void this.recoverAudioGraphAfterDataStall(
        "PCM worklet processor error",
        undefined,
        { force },
      );
    };

    // Connected to the destination only so the render loop pulls the worklet
    // every quantum. process() never writes its outputs, and must not: the
    // destination is the real output device, so anything written there would
    // play the meeting back through the user's speakers.
    sourceNode.connect(this.pcmWorkletNode);
    this.pcmWorkletNode.connect(this.audioContext.destination);

    log.debug("PCM streaming setup complete with AudioWorklet");
  }

  private setupTrackMonitoring(): void {
    this.setupTrackMonitoringForStream(this.mediaStream, "microphone");
    this.setupTrackMonitoringForStream(this.micStream, "microphone");
    this.setupTrackMonitoringForStream(this.systemStream, "system");
  }

  private setupTrackMonitoringForStream(
    stream: MediaStream | null,
    source: AudioSourceKind,
  ): void {
    if (!stream) return;

    for (const track of stream.getAudioTracks()) {
      this.clearTrackMuteTimer(track);

      track.onended = () => this.handleTrackEnded(track, source);
      track.onmute = () => this.handleTrackMute(track, source);
      track.onunmute = () => this.handleTrackUnmute(track, source);
    }
  }

  private handleTrackEnded(
    track: MediaStreamTrack,
    source: AudioSourceKind,
  ): void {
    this.clearTrackMuteTimer(track);

    if (this.isStopping) {
      log.debug("Track ended (expected during cleanup)", { source });
      return;
    }

    if (source === "microphone") {
      log.error("Microphone track ended unexpectedly - attempting restart", {
        label: track.label,
        readyState: track.readyState,
      });
      this.callbacks.onRecoveryLog?.(
        "Microphone track ended; attempting to restart audio capture.",
      );
      void this.recoverMicrophoneTrack(track, "ended").then((recovered) => {
        if (recovered) return;
        this.callbacks.onTrackEnded?.("microphone");
        void this.recoverAudioGraphAfterDataStall(
          "microphone track ended recovery failed",
        );
      });
      return;
    }

    log.error("System audio track ended unexpectedly", {
      label: track.label,
      readyState: track.readyState,
    });
    void this.recoverSystemAudioTrack(track, "ended").then((recovered) => {
      if (recovered) return;
      this.callbacks.onTrackEnded?.("system");
      void this.recoverAudioGraphAfterDataStall(
        "system audio track ended recovery failed",
      );
    });
  }

  private handleTrackMute(
    track: MediaStreamTrack,
    source: AudioSourceKind,
  ): void {
    this.lastMuteTime = Date.now();
    this.consecutiveMuteEvents++;
    log.warn("Track muted - may be temporary", {
      source,
      label: track.label,
      consecutive: this.consecutiveMuteEvents,
      isSafari: this.browserInfo.isSafari,
    });

    if (this.consecutiveMuteEvents >= 3) {
      log.error("Multiple consecutive mute events - possible input issue", {
        source,
      });
    }

    this.scheduleMutedTrackRecovery(
      track,
      source,
      AudioRecorder.TRACK_MUTE_RECOVERY_MS,
    );
  }

  private handleTrackUnmute(
    track: MediaStreamTrack,
    source: AudioSourceKind,
  ): void {
    const muteDuration = this.lastMuteTime ? Date.now() - this.lastMuteTime : 0;
    this.consecutiveMuteEvents = 0;
    this.clearTrackMuteTimer(track);
    log.debug("Track unmuted", {
      source,
      label: track.label,
      muteDuration,
      isSafari: this.browserInfo.isSafari,
    });
  }

  private async recoverMicrophoneTrack(
    track: MediaStreamTrack,
    trigger: TrackRecoveryTrigger,
  ): Promise<boolean> {
    const streamMode = this.getMicrophoneStreamMode(track);
    if (!this.shouldRecoverMicrophoneTrack(track, trigger, streamMode)) {
      return false;
    }

    // stillValid drops the recovered stream if this track was swapped out by
    // a concurrent recovery while getUserMedia was in flight.
    const result = await this.reacquireMicrophone(`track ${trigger}`, {
      stillValid: () => this.getMicrophoneStreamMode(track) !== null,
    });
    return result === "recovered";
  }

  /**
   * Re-acquire the microphone stream and swap it into the live graph.
   * Shared by track-event recovery, device-topology revalidation, and the
   * dead-air ladder.
   */
  private async reacquireMicrophone(
    reason: string,
    opts?: {
      cooldownMs?: number;
      stillValid?: () => boolean;
      /** Dead-air recovery: hunt other inputs when the re-acquired default is still silent. */
      fallbackToAnyLiveInput?: boolean;
    },
  ): Promise<ReacquireOutcome> {
    if (!this.isRecording || this.isPaused || this.isStopping) {
      return "blocked";
    }
    if (!this.micStream && !this.mediaStream) return "blocked";
    if (this.microphoneRecoveryInProgress) {
      log.warn("Microphone recovery already in progress", { reason });
      return "blocked";
    }
    if (
      this.isRecoveryOnCooldown(
        this.lastMicrophoneRecoveryTime,
        opts?.cooldownMs,
        "microphone",
        reason,
      )
    ) {
      return "blocked";
    }

    this.microphoneRecoveryInProgress = true;
    const generationAtStart = this.micSwapGeneration;
    let newStream: MediaStream | null = null;

    try {
      const currentTrack = this.getPrimaryMicTrack();
      log.warn("Restarting microphone capture", {
        reason,
        label: currentTrack?.label,
        muted: currentTrack?.muted,
        readyState: currentTrack?.readyState,
      });

      newStream = await this.getUserMedia(false);
      let newTrack = newStream.getAudioTracks()[0];
      if (!newTrack)
        throw new Error("Recovered microphone stream has no audio track");

      // Blind re-acquisition of a dead default route usually hands back the
      // same dead route. When the dead-air ladder asked for this recovery
      // and the user hasn't pinned a device, measure the fresh stream and
      // hunt the other inputs for one carrying actual signal.
      if (
        opts?.fallbackToAnyLiveInput &&
        !this.preferredDeviceId &&
        this.audioContext
      ) {
        // Pseudo-ids ("default") can't be re-pinned — omit to reopen default.
        const settingsId = newStream
          .getAudioTracks()[0]
          ?.getSettings().deviceId;
        const currentDeviceId =
          settingsId === "default" || settingsId === "communications"
            ? undefined
            : settingsId;

        const replacement = await findLiveMicrophone(newStream, {
          measureStreamDb: (stream) =>
            measureStreamMaxDb(this.audioContext!, stream),
          enumerateInputs: async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
              .filter(
                (device) =>
                  device.kind === "audioinput" &&
                  device.deviceId &&
                  device.deviceId !== "default" &&
                  device.deviceId !== "communications",
              )
              .map((device) => ({
                deviceId: device.deviceId,
                label: device.label,
              }));
          },
          openStream: (deviceId) =>
            navigator.mediaDevices.getUserMedia(
              this.buildMicConstraints(deviceId),
            ),
          reopenUnprocessed: () =>
            navigator.mediaDevices.getUserMedia(
              this.buildUnprocessedMicConstraints(currentDeviceId),
            ),
          stopStream: (stream) => this.stopStreamTracks(stream),
          log: (message) => this.callbacks.onRecoveryLog?.(message),
        });
        if (replacement) {
          this.stopStreamTracks(newStream);
          newStream = replacement.stream;
          newTrack = newStream.getAudioTracks()[0];
          if (!newTrack)
            throw new Error("Replacement microphone stream has no audio track");
        }
      }

      // Another swap landed while getUserMedia was in flight (e.g. the user
      // switched devices) — their stream wins; don't revert it.
      if (generationAtStart !== this.micSwapGeneration) {
        log.debug("Skipping superseded microphone recovery", { reason });
        this.stopStreamTracks(newStream);
        return "recovered";
      }
      if (opts?.stillValid && !opts.stillValid()) {
        log.debug("Skipping stale microphone recovery", { reason });
        this.stopStreamTracks(newStream);
        return "recovered";
      }

      if (this.micStream) {
        this.swapMixedMicrophoneStream(newStream);
      } else if (this.mediaStream) {
        this.swapSingleMicrophoneStream(newStream);
      } else {
        // Graph was torn down while getUserMedia was in flight.
        this.stopStreamTracks(newStream);
        return "blocked";
      }

      newStream = null;
      this.recoveryCounters.microphone++;
      this.lastMicrophoneRecoveryTime = Date.now();
      this.lastMuteTime = null;
      this.consecutiveMuteEvents = 0;
      this.scheduleDataFlowDeadline(
        "microphone source recovery",
        this.getRecoveryDataTimeoutMs(
          AudioRecorder.SOURCE_RECOVERY_DATA_TIMEOUT_MS,
        ),
      );

      log.info("Microphone capture restarted", {
        reason,
        label: newTrack.label,
      });
      this.callbacks.onRecoveryLog?.(
        `Microphone capture restarted (${reason}).`,
      );
      return "recovered";
    } catch (error) {
      if (newStream) this.stopStreamTracks(newStream);
      log.error("Failed to restart microphone capture", {
        reason,
        error: error instanceof Error ? error.message : String(error),
      });
      this.callbacks.onRecoveryLog?.(
        `Microphone recovery failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return "failed";
    } finally {
      this.microphoneRecoveryInProgress = false;
    }
  }

  private shouldRecoverMicrophoneTrack(
    track: MediaStreamTrack,
    trigger: TrackRecoveryTrigger,
    streamMode: "mixed" | "single" | null,
  ): boolean {
    if (!this.isRecording || this.isPaused || this.isStopping) return false;
    if (!streamMode) return false;
    if (trigger === "mute" && !track.muted) return false;

    if (this.microphoneRecoveryInProgress) {
      log.warn("Microphone recovery already in progress", { trigger });
      return false;
    }

    const elapsedSinceRecovery = Date.now() - this.lastMicrophoneRecoveryTime;
    if (
      this.lastMicrophoneRecoveryTime > 0 &&
      elapsedSinceRecovery < AudioRecorder.TRACK_RESTART_COOLDOWN_MS
    ) {
      const remainingCooldown =
        AudioRecorder.TRACK_RESTART_COOLDOWN_MS - elapsedSinceRecovery;
      log.warn("Skipping microphone recovery during cooldown", {
        trigger,
        elapsedSinceRecovery,
        remainingCooldown,
      });
      if (trigger === "mute") {
        this.scheduleMutedTrackRecovery(track, "microphone", remainingCooldown);
      }
      return false;
    }

    return true;
  }

  private async recoverSystemAudioTrack(
    track: MediaStreamTrack,
    trigger: TrackRecoveryTrigger,
  ): Promise<boolean> {
    if (!this.shouldRecoverSystemAudioTrack(track, trigger)) return false;

    const result = await this.reacquireSystemAudio(`track ${trigger}`, {
      stillValid: () =>
        this.systemStream?.getAudioTracks().includes(track) ?? false,
    });
    return result === "recovered";
  }

  /**
   * Re-acquire system audio and swap it into the live graph. Windows' legacy/
   * fallback `loopback` path resolves getDisplayMedia against the current
   * default render endpoint; supported non-muted Windows uses all-device
   * process loopback instead. Re-acquisition refreshes either path after an
   * output-device change. Shared by track-event recovery, device-topology
   * revalidation, and the dead-air ladder.
   */
  private async reacquireSystemAudio(
    reason: string,
    opts?: { cooldownMs?: number; stillValid?: () => boolean },
  ): Promise<ReacquireOutcome> {
    if (!this.isRecording || this.isPaused || this.isStopping) {
      return "blocked";
    }
    if (!this.systemStream || !this.enableSystemAudio) return "blocked";
    if (this.systemAudioStreamOverride) {
      // Pre-captured override streams can't be re-acquired from here.
      log.warn("Skipping system audio recovery for override stream", {
        reason,
      });
      return "blocked";
    }
    if (this.systemRecoveryInProgress) {
      log.warn("System audio recovery already in progress", { reason });
      return "blocked";
    }
    if (
      this.isRecoveryOnCooldown(
        this.lastSystemRecoveryTime,
        opts?.cooldownMs,
        "system audio",
        reason,
      )
    ) {
      return "blocked";
    }

    this.systemRecoveryInProgress = true;
    let newStream: MediaStream | null = null;

    try {
      const currentTrack = this.systemStream.getAudioTracks()[0];
      log.warn("Restarting system audio capture", {
        reason,
        label: currentTrack?.label,
        muted: currentTrack?.muted,
        readyState: currentTrack?.readyState,
      });

      newStream = await this.getUserMedia(true);
      const newTrack = newStream.getAudioTracks()[0];
      if (!newTrack)
        throw new Error("Recovered system audio stream has no audio track");

      if (opts?.stillValid && !opts.stillValid()) {
        log.debug("Skipping stale system audio recovery", { reason });
        this.stopStreamTracks(newStream);
        return "recovered";
      }
      if (!this.systemStream) {
        // Graph was torn down while getDisplayMedia was in flight.
        this.stopStreamTracks(newStream);
        return "blocked";
      }

      this.swapSystemAudioStream(newStream);
      newStream = null;
      this.recoveryCounters.system++;
      this.lastSystemRecoveryTime = Date.now();
      this.scheduleDataFlowDeadline(
        "system audio source recovery",
        this.getRecoveryDataTimeoutMs(
          AudioRecorder.SOURCE_RECOVERY_DATA_TIMEOUT_MS,
        ),
      );

      log.info("System audio capture restarted", {
        reason,
        label: newTrack.label,
      });
      this.callbacks.onRecoveryLog?.(
        `System audio capture restarted (${reason}).`,
      );
      return "recovered";
    } catch (error) {
      if (newStream) this.stopStreamTracks(newStream);
      log.error("Failed to restart system audio capture", {
        reason,
        error: error instanceof Error ? error.message : String(error),
      });
      this.callbacks.onRecoveryLog?.(
        `System audio recovery failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return "failed";
    } finally {
      this.systemRecoveryInProgress = false;
    }
  }

  // Shared cooldown gate for mic/system re-acquisition. Only a SUCCESSFUL
  // recovery arms the cooldown (lastRecoveryTime is set on swap), so failed
  // attempts stay retryable on their trigger's own schedule.
  private isRecoveryOnCooldown(
    lastRecoveryTime: number,
    cooldownMs: number | undefined,
    label: "microphone" | "system audio",
    reason: string,
  ): boolean {
    const cooldown = cooldownMs ?? AudioRecorder.TRACK_RESTART_COOLDOWN_MS;
    if (lastRecoveryTime <= 0) return false;
    const elapsedSinceRecovery = Date.now() - lastRecoveryTime;
    if (elapsedSinceRecovery >= cooldown) return false;
    log.warn(`Skipping ${label} recovery during cooldown`, {
      reason,
      elapsedSinceRecovery,
    });
    return true;
  }

  private getPrimaryMicTrack(): MediaStreamTrack | undefined {
    return (this.micStream ?? this.mediaStream)?.getAudioTracks()[0];
  }

  private shouldRecoverSystemAudioTrack(
    track: MediaStreamTrack,
    trigger: TrackRecoveryTrigger,
  ): boolean {
    if (!this.isRecording || this.isPaused || this.isStopping) return false;
    if (!this.systemStream?.getAudioTracks().includes(track)) return false;
    if (trigger === "mute" && !track.muted) return false;

    if (this.systemAudioStreamOverride) {
      log.warn("Skipping system audio recovery for override stream", {
        trigger,
      });
      return false;
    }

    if (!this.enableSystemAudio) {
      log.warn("Skipping system audio recovery outside Electron", { trigger });
      return false;
    }

    if (this.systemRecoveryInProgress) {
      log.warn("System audio recovery already in progress", { trigger });
      return false;
    }

    const elapsedSinceRecovery = Date.now() - this.lastSystemRecoveryTime;
    if (
      this.lastSystemRecoveryTime > 0 &&
      elapsedSinceRecovery < AudioRecorder.TRACK_RESTART_COOLDOWN_MS
    ) {
      const remainingCooldown =
        AudioRecorder.TRACK_RESTART_COOLDOWN_MS - elapsedSinceRecovery;
      log.warn("Skipping system audio recovery during cooldown", {
        trigger,
        elapsedSinceRecovery,
        remainingCooldown,
      });
      if (trigger === "mute") {
        this.scheduleMutedTrackRecovery(track, "system", remainingCooldown);
      }
      return false;
    }

    return true;
  }

  /**
   * True when the session that requested this recovery is gone (stopped, or
   * a new session started) — in which case anything the rebuild already
   * created is torn down before returning. Without this, a rebuild that
   * finished after stopRecording()'s cleanup would leave an ownerless
   * capture running: live mic/system tracks, an open AudioContext, and a
   * worklet still streaming, with no handle left to stop them.
   */
  private async abortRecoveryIfStale(
    generation: number,
    stage: string,
  ): Promise<boolean> {
    if (generation === this.sessionGeneration && !this.isStopping) return false;

    log.warn("Audio graph recovery cancelled mid-flight", {
      stage,
      generation,
      currentGeneration: this.sessionGeneration,
      isStopping: this.isStopping,
    });

    try {
      await this.teardownAudioGraphForRecovery();
    } catch (error) {
      log.warn("Failed to clean up cancelled recovery", {
        stage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return true;
  }

  private async recoverAudioGraphAfterDataStall(
    reason: string,
    timeSinceData = Date.now() - this.lastDataTime,
    options?: { force?: boolean },
  ): Promise<void> {
    if (!this.shouldRecoverAudioGraph(options?.force ?? false)) return;

    const generation = this.sessionGeneration;
    this.graphRecoveryInProgress = true;
    this.lastGraphRecoveryTime = Date.now();
    this.graphRecoveryAttemptsWithoutData++;
    this.recoveryCounters.graph++;
    this.clearDataFlowDeadline();

    try {
      log.warn("Restarting audio graph after data stall", {
        reason,
        timeSinceData,
        contextState: this.audioContext?.state,
        transcriptOnly: this.transcriptOnly,
        enableSystemAudio: this.enableSystemAudio,
        attemptsWithoutData: this.graphRecoveryAttemptsWithoutData,
      });
      this.callbacks.onRecoveryLog?.(
        "Audio graph stalled; restarting audio capture pipeline.",
      );

      // Each step below can await for seconds (MediaRecorder flush, device
      // open, permission prompts). The session can be stopped in any of
      // those windows, so the generation is re-checked after every await —
      // otherwise a rebuild completing after stopRecording()'s cleanup would
      // leave live streams and a running context with no owner (mic stays
      // hot, nothing left to stop it).
      await this.teardownAudioGraphForRecovery();
      if (await this.abortRecoveryIfStale(generation, "teardown")) return;

      await this.createAudioContext();
      if (await this.abortRecoveryIfStale(generation, "context")) return;

      await this.getAudioStreams();
      if (await this.abortRecoveryIfStale(generation, "streams")) return;

      // Before the graph, not after: setupAudioGraph() starts MediaRecorder
      // and then awaits the worklet module, so a pause applied afterwards
      // would still have let that window record.
      this.applyPauseStateToStreams();

      await this.setupAudioGraph();
      if (await this.abortRecoveryIfStale(generation, "graph")) return;

      // Covers a pause that landed during setupAudioGraph itself. The worklet
      // is told separately when it reports ready — it cannot receive messages
      // before that.
      this.applyPauseStateToStreams();

      log.info("Audio graph restarted after data stall", {
        contextState: this.audioContext?.state,
        actualSampleRate: this.actualSampleRate,
      });
      this.callbacks.onRecoveryLog?.(
        "Audio capture pipeline restarted after data stall.",
      );
    } catch (error) {
      log.error("Failed to restart audio graph after data stall", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.callbacks.onRecoveryLog?.(
        `Audio graph recovery failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.graphRecoveryInProgress = false;
    }
  }

  private shouldRecoverAudioGraph(force = false): boolean {
    if (!this.isRecording || this.isPaused || this.isStopping) return false;
    if (this.graphRecoveryInProgress) return false;
    if (!this.pcmDataCallback && this.transcriptOnly) return false;

    // A terminal failure (worklet processor crash) skips the cooldown: the
    // ladder paces retries of transient stalls, but a crashed processor is
    // silent forever and waiting cannot help. Lifecycle guards above still
    // apply, and the caller bounds forcing to once per crash.
    if (force) return true;

    const elapsedSinceRecovery = Date.now() - this.lastGraphRecoveryTime;
    const cooldown = this.getGraphRecoveryCooldownMs();
    if (this.lastGraphRecoveryTime > 0 && elapsedSinceRecovery < cooldown) {
      log.warn("Skipping audio graph recovery during cooldown", {
        elapsedSinceRecovery,
        remainingCooldown: cooldown - elapsedSinceRecovery,
        attemptsWithoutData: this.graphRecoveryAttemptsWithoutData,
      });
      return false;
    }

    return true;
  }

  private getGraphRecoveryCooldownMs(): number {
    if (this.graphRecoveryAttemptsWithoutData <= 1) {
      return AudioRecorder.GRAPH_RESTART_COOLDOWN_MS;
    }

    const multiplier = 2 ** (this.graphRecoveryAttemptsWithoutData - 1);
    return Math.min(
      AudioRecorder.GRAPH_RESTART_COOLDOWN_MS * multiplier,
      AudioRecorder.GRAPH_RESTART_MAX_COOLDOWN_MS,
    );
  }

  private getRecoveryDataTimeoutMs(baseTimeoutMs: number): number {
    if (this.pcmDataCallback) return baseTimeoutMs;

    const mediaSliceMs = this.mediaTimesliceMs ?? 10000;
    return Math.max(baseTimeoutMs, mediaSliceMs + 5000);
  }

  private async teardownAudioGraphForRecovery(): Promise<void> {
    this.clearTrackMuteTimers();
    this.clearDataFlowDeadline();
    this.stopMeteringTimers();
    await this.stopMediaRecorderForRecovery();

    this.disconnectAudioNodes();
    if (
      this.systemAudioStreamOverride &&
      this.systemStream === this.systemAudioStreamOverride
    ) {
      // Caller-owned override streams must survive graph recovery so the
      // rebuilt graph can reuse their live tracks.
      this.systemStream = null;
    }
    this.stopActiveStreams();
    await this.closeAudioContext();
  }

  /**
   * Detach and close the context, giving close() a deadline.
   *
   * close() resolves only once Chromium has torn down the audio thread, and
   * a wedged capture device can leave that promise pending indefinitely —
   * which would hang stop (latching the recorder for the rest of the app's
   * life) and hang graph recovery, on exactly the broken hardware where both
   * matter most. The context is dereferenced first, so abandoning the wait
   * leaks nothing that a later garbage collection won't take.
   *
   * Callers must release the capture tracks BEFORE this: a stalled close()
   * with tracks still open leaves the OS mic indicator lit.
   */
  private async closeAudioContext(): Promise<void> {
    const context = this.audioContext;
    if (!context) return;

    context.onstatechange = null;
    this.audioContext = null;

    try {
      await withTimeout(
        context.close(),
        AudioRecorder.CONTEXT_CLOSE_TIMEOUT_MS,
        "AudioContext.close",
      );
    } catch (error) {
      log.warn("AudioContext close did not complete", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async stopMediaRecorderForRecovery(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === "inactive") {
      this.mediaRecorder = null;
      return;
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 1500);
      recorder.onstop = () => {
        clearTimeout(timeout);
        resolve();
      };

      try {
        recorder.requestData();
      } catch (error) {
        log.warn("MediaRecorder requestData failed during graph recovery", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      try {
        recorder.stop();
      } catch (error) {
        clearTimeout(timeout);
        log.warn("MediaRecorder stop failed during graph recovery", {
          error: error instanceof Error ? error.message : String(error),
        });
        resolve();
      }
    });

    this.mediaRecorder = null;
  }

  private stopMeteringTimers(): void {
    if (this.meterTimer) {
      clearInterval(this.meterTimer);
      this.meterTimer = null;
    }
    if (this.micActivityTimer) {
      clearInterval(this.micActivityTimer);
      this.micActivityTimer = null;
    }
  }

  /**
   * Inserts the compliance gate between the graph's output and the nodes that
   * persist audio — the MediaRecorder destination and the PCM worklet feeding
   * the live transcript.
   *
   * Deliberately downstream of the analysers, so metering keeps reporting the
   * room even while nothing is being recorded. The heartbeat then shows sound
   * present alongside a silenced recording, which is what makes a support
   * ticket about a blank transcript answerable.
   */
  private gateRecordingOutput(output: AudioNode): AudioNode {
    if (!this.audioContext) return output;

    const gate = this.audioContext.createGain();
    gate.gain.value = this.silenced ? 0 : 1;
    output.connect(gate);
    this.complianceGainNode = gate;
    return gate;
  }

  /**
   * Drops or restores every recorded sample without touching the capture
   * graph, so the session, its buffers and its socket all survive the change.
   */
  setSilenced(silenced: boolean): void {
    this.silenced = silenced;
    if (this.complianceGainNode) {
      this.complianceGainNode.gain.value = silenced ? 0 : 1;
    }
  }

  isSilenced(): boolean {
    return this.silenced;
  }

  /**
   * Gates the microphone branch alone, upstream of everything that hears the
   * mic: the mix, the mic analyser and, in mic-only sessions, the recording.
   * Recovery reconnects a swapped microphone above this node, so the gate
   * holds across device changes; a rebuilt graph re-reads the flag.
   */
  private gateMicrophone(micOutput: AudioNode): AudioNode {
    if (!this.audioContext) return micOutput;

    const gate = this.audioContext.createGain();
    gate.channelCount = 1;
    gate.channelCountMode = "explicit";
    gate.channelInterpretation = "speakers";
    gate.gain.value = this.micMuted ? 0 : 1;
    micOutput.connect(gate);
    this.micMuteGainNode = gate;
    return gate;
  }

  /**
   * Silences or restores the microphone only. System audio keeps flowing, so
   * a meeting loses none of the other side while the user's voice is spoken
   * to something other than the meeting.
   */
  setMicrophoneMuted(muted: boolean): void {
    this.micMuted = muted;
    this.silenceTracker?.noteMicGate(muted, performance.now());
    if (this.micMuteGainNode) {
      this.micMuteGainNode.gain.value = muted ? 0 : 1;
    }
  }

  isMicrophoneMuted(): boolean {
    return this.micMuted;
  }

  private disconnectAudioNodes(): void {
    this.disconnectNode(this.sourceNode, "source node");
    this.disconnectNode(this.micSourceNode, "mic source node");
    this.disconnectNode(this.systemSourceNode, "system source node");
    this.disconnectNode(this.sourceKeepAliveNode, "keep-alive node");
    this.disconnectNode(this.micGainNode, "mic gain node");
    this.disconnectNode(this.systemGainNode, "system gain node");
    this.disconnectNode(this.complianceGainNode, "compliance gate");
    this.disconnectNode(this.micMuteGainNode, "microphone gate");
    this.disconnectNode(this.analyserNode, "analyser node");
    this.disconnectNode(this.micAnalyserNode, "mic analyser node");
    this.disconnectNode(this.systemAnalyserNode, "system analyser node");
    this.disconnectPCMWorkletNode();

    this.sourceNode = null;
    this.micSourceNode = null;
    this.systemSourceNode = null;
    this.sourceKeepAliveNode = null;
    this.micGainNode = null;
    this.systemGainNode = null;
    this.complianceGainNode = null;
    this.micMuteGainNode = null;
    this.analyserNode = null;
    this.analyserBuffer = null;
    this.micAnalyserNode = null;
    this.micAnalyserBuffer = null;
    this.systemAnalyserNode = null;
    this.systemAnalyserBuffer = null;
    this.mediaDestination = null;
    this.singleSourceTargets = [];
    this.systemSourceTargets = [];
  }

  private disconnectNode(node: AudioNode | null, label: string): void {
    if (!node) return;

    try {
      node.disconnect();
    } catch (error) {
      log.warn(`Failed to disconnect ${label}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private disconnectPCMWorkletNode(): void {
    if (!this.pcmWorkletNode) return;

    try {
      if (this.pcmWorkletReady) {
        this.pcmWorkletNode.port.postMessage({ type: "stop" });
      }
      this.pcmWorkletNode.disconnect();
    } catch (error) {
      log.warn("Failed to disconnect PCM worklet node", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.pcmWorkletNode = null;
    this.pcmWorkletReady = false;
    this.pcmWorkletInstalledAt = 0;
  }

  private stopActiveStreams(): void {
    if (this.mediaStream) {
      this.stopStreamTracks(this.mediaStream);
      this.mediaStream = null;
    }
    if (this.micStream) {
      this.stopStreamTracks(this.micStream);
      this.micStream = null;
    }
    if (this.systemStream) {
      this.stopStreamTracks(this.systemStream);
      this.systemStream = null;
    }
  }

  private getMicrophoneStreamMode(
    track: MediaStreamTrack,
  ): "mixed" | "single" | null {
    if (this.micStream?.getAudioTracks().includes(track)) return "mixed";
    if (this.mediaStream?.getAudioTracks().includes(track)) return "single";
    return null;
  }

  private swapMixedMicrophoneStream(newStream: MediaStream): void {
    if (!this.audioContext || !this.micGainNode) {
      throw new Error("Mixed microphone graph is not ready for recovery");
    }

    const previousStream = this.micStream;
    const previousSource = this.micSourceNode;
    const nextSource = this.audioContext.createMediaStreamSource(newStream);

    nextSource.connect(this.micGainNode);
    previousSource?.disconnect();

    this.micSourceNode = nextSource;
    this.micStream = newStream;
    this.micSwapGeneration++;
    this.setupTrackMonitoringForStream(newStream, "microphone");
    this.applyPauseStateToStreams();

    if (previousStream) this.stopStreamTracks(previousStream);
  }

  private swapSingleMicrophoneStream(newStream: MediaStream): void {
    if (!this.audioContext || this.singleSourceTargets.length === 0) {
      throw new Error(
        "Single-source microphone graph is not ready for recovery",
      );
    }

    const previousStream = this.mediaStream;
    const previousSource = this.sourceNode;
    const nextSource = this.audioContext.createMediaStreamSource(newStream);

    for (const target of this.singleSourceTargets) {
      nextSource.connect(target);
    }
    previousSource?.disconnect();

    this.sourceNode = nextSource;
    this.mediaStream = newStream;
    this.micSwapGeneration++;
    this.setupTrackMonitoringForStream(newStream, "microphone");
    this.applyPauseStateToStreams();

    if (previousStream) this.stopStreamTracks(previousStream);
  }

  /** Remember the device to use on the next mic acquisition (e.g. next start). */
  public setPreferredInputDevice(deviceId?: string): void {
    this.preferredDeviceId = deviceId;
  }

  /**
   * Switch the microphone to `deviceId`. Records the preference (so a later
   * start uses it) and, when a recording is active, re-acquires the mic on the
   * new device and swaps it into the live audio graph without restarting.
   */
  public async switchInputDevice(deviceId: string): Promise<void> {
    this.preferredDeviceId = deviceId;

    const hasActiveMic =
      !!this.audioContext && (!!this.micStream || !!this.mediaStream);
    if (!hasActiveMic) return;

    const newStream = await navigator.mediaDevices.getUserMedia(
      this.buildMicConstraints(deviceId),
    );

    try {
      if (this.micStream) {
        this.swapMixedMicrophoneStream(newStream);
      } else {
        this.swapSingleMicrophoneStream(newStream);
      }
    } catch (error) {
      this.stopStreamTracks(newStream);
      throw error;
    }
  }

  private swapSystemAudioStream(newStream: MediaStream): void {
    if (!this.audioContext || this.systemSourceTargets.length === 0) {
      throw new Error("System audio graph is not ready for recovery");
    }

    const previousStream = this.systemStream;
    const previousSource = this.systemSourceNode;
    const nextSource = this.audioContext.createMediaStreamSource(newStream);

    for (const target of this.systemSourceTargets) {
      nextSource.connect(target);
    }
    previousSource?.disconnect();

    this.systemSourceNode = nextSource;
    this.systemStream = newStream;
    this.setupTrackMonitoringForStream(newStream, "system");
    this.applyPauseStateToStreams();

    if (previousStream) this.stopStreamTracks(previousStream);
  }

  private clearTrackMuteTimer(track: MediaStreamTrack): void {
    const timer = this.trackMuteTimers.get(track);
    if (!timer) return;

    clearTimeout(timer);
    this.trackMuteTimers.delete(track);
  }

  private scheduleMutedTrackRecovery(
    track: MediaStreamTrack,
    source: AudioSourceKind,
    delayMs: number,
  ): void {
    this.clearTrackMuteTimer(track);
    const timer = setTimeout(
      () => {
        this.trackMuteTimers.delete(track);
        if (!track.muted) return;

        if (source === "microphone") {
          void this.recoverMicrophoneTrack(track, "mute");
          return;
        }
        void this.recoverSystemAudioTrack(track, "mute");
      },
      Math.max(0, delayMs),
    );
    this.trackMuteTimers.set(track, timer);
  }

  private scheduleDataFlowDeadline(reason: string, timeoutMs: number): void {
    if (!this.isRecording || this.isPaused || this.isStopping) return;

    const deadlineAt = Date.now() + timeoutMs;
    if (this.dataFlowDeadlineTimer && this.dataFlowDeadlineAt <= deadlineAt) {
      return;
    }

    this.clearDataFlowDeadline();
    const sequenceAtSchedule = this.dataFlowSequence;
    this.dataFlowDeadlineAt = deadlineAt;
    this.dataFlowDeadlineTimer = setTimeout(() => {
      this.dataFlowDeadlineTimer = null;
      this.dataFlowDeadlineAt = 0;
      if (sequenceAtSchedule !== this.dataFlowSequence) return;

      log.warn("No audio data after recovery deadline", {
        reason,
        timeoutMs,
        timeSinceData: Date.now() - this.lastDataTime,
      });
      void this.recoverAudioGraphAfterDataStall(reason);
    }, timeoutMs);
  }

  private clearDataFlowDeadline(): void {
    if (!this.dataFlowDeadlineTimer) {
      this.dataFlowDeadlineAt = 0;
      return;
    }

    clearTimeout(this.dataFlowDeadlineTimer);
    this.dataFlowDeadlineTimer = null;
    this.dataFlowDeadlineAt = 0;
  }

  private markDataFlow(): void {
    this.lastDataTime = Date.now();
    this.dataFlowSequence++;
    this.graphRecoveryAttemptsWithoutData = 0;
    this.clearDataFlowDeadline();
  }

  private clearTrackMuteTimers(): void {
    for (const timer of this.trackMuteTimers.values()) {
      clearTimeout(timer);
    }
    this.trackMuteTimers.clear();
  }

  private stopStreamTracks(stream: MediaStream): void {
    for (const track of stream.getTracks()) {
      this.clearTrackMuteTimer(track);
      track.onended = null;
      track.onmute = null;
      track.onunmute = null;
      track.stop();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Meter one worklet output chunk into the rotating max buckets.
  private trackPcmLevel(samples: Float32Array): void {
    let sumSq = 0;
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i];
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, samples.length));
    const db = 20 * Math.log10(Math.max(rms, 1e-12));

    this.pcmBucketMaxDb = Math.max(this.pcmBucketMaxDb, db);
    if (++this.pcmChunkCount >= AudioRecorder.PCM_LEVEL_BUCKET_CHUNKS) {
      this.pcmChunkCount = 0;
      this.pcmPrevBucketMaxDb = this.pcmBucketMaxDb;
      this.pcmBucketMaxDb = -Infinity;
    }
  }

  /** Max PCM output level (dB) over the last ~5–10s; -999 before any data. */
  private getPcmDb(): number {
    const max = Math.max(this.pcmBucketMaxDb, this.pcmPrevBucketMaxDb);
    return max === -Infinity ? -999 : max;
  }

  private computeRmsDb(
    analyser: AnalyserNode,
    buffer: Float32Array<ArrayBuffer>,
  ): number {
    analyser.getFloatTimeDomainData(buffer);
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i];
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, buffer.length));
    return 20 * Math.log10(Math.max(rms, 1e-12));
  }

  private startMicActivityMonitoring(): void {
    if (this.micActivityTimer) {
      clearInterval(this.micActivityTimer);
    }
    if (!this.micAnalyserNode || !this.micAnalyserBuffer) return;

    const initialMicDb = this.computeRmsDb(
      this.micAnalyserNode,
      this.micAnalyserBuffer,
    );
    let initialMicActive: boolean;
    if (this.systemAnalyserNode && this.systemAnalyserBuffer) {
      const initialSystemDb = this.computeRmsDb(
        this.systemAnalyserNode,
        this.systemAnalyserBuffer,
      );
      initialMicActive =
        initialMicDb > AudioRecorder.MIC_ACTIVE_THRESHOLD_DB &&
        (initialSystemDb < AudioRecorder.SYSTEM_ACTIVE_THRESHOLD_DB ||
          initialMicDb - initialSystemDb > AudioRecorder.MIC_DOMINANCE_DB);
    } else {
      initialMicActive = initialMicDb > AudioRecorder.MIC_ACTIVE_THRESHOLD_DB;
    }
    const initialState: "on" | "off" = initialMicActive ? "on" : "off";
    const elapsedSec =
      this.startTimestampMs !== null
        ? (Date.now() - this.startTimestampMs) / 1000
        : 0;
    this.currentMicState = initialState;
    this.lastMicStateTimeSec = elapsedSec;
    log.debug("Initial mic state", {
      state: initialState,
      elapsedSec: elapsedSec.toFixed(1),
      micDb: initialMicDb.toFixed(1),
    });
    this.callbacks.onMicStateChanged?.(initialState, elapsedSec);

    this.micActivityTimer = setInterval(() => {
      if (!this.isRecording || this.isPaused) return;
      if (!this.micAnalyserNode || !this.micAnalyserBuffer) return;

      const micDb = this.computeRmsDb(
        this.micAnalyserNode,
        this.micAnalyserBuffer,
      );

      let systemDb = -Infinity;
      let micActive: boolean;
      if (this.systemAnalyserNode && this.systemAnalyserBuffer) {
        systemDb = this.computeRmsDb(
          this.systemAnalyserNode,
          this.systemAnalyserBuffer,
        );
        micActive =
          micDb > AudioRecorder.MIC_ACTIVE_THRESHOLD_DB &&
          (systemDb < AudioRecorder.SYSTEM_ACTIVE_THRESHOLD_DB ||
            micDb - systemDb > AudioRecorder.MIC_DOMINANCE_DB);
      } else {
        micActive = micDb > AudioRecorder.MIC_ACTIVE_THRESHOLD_DB;
      }

      const newState: "on" | "off" = micActive ? "on" : "off";

      if (newState === this.currentMicState) {
        // Decay instead of hard reset — a single blip doesn't erase progress
        this.micStateConsecutiveCount = Math.max(
          0,
          this.micStateConsecutiveCount - 1,
        );
      } else {
        this.micStateConsecutiveCount++;
      }

      // Asymmetric debounce: quick to detect speech start, slow to declare end
      // Threshold is based on the transition we're moving toward (leaving currentMicState)
      const requiredCount =
        this.currentMicState === "on"
          ? AudioRecorder.MIC_OFF_DEBOUNCE_COUNT
          : AudioRecorder.MIC_ON_DEBOUNCE_COUNT;

      if (this.micStateConsecutiveCount >= requiredCount) {
        const elapsedSec =
          this.startTimestampMs !== null
            ? (Date.now() - this.startTimestampMs) / 1000
            : 0;
        this.lastMicStateTimeSec = elapsedSec;
        this.micStateConsecutiveCount = 0;

        if (newState !== this.currentMicState) {
          this.currentMicState = newState;
          this.callbacks.onMicStateChanged?.(newState, elapsedSec);
        }
      }
    }, AudioRecorder.MIC_ACTIVITY_INTERVAL_MS);
  }

  private setupMediaRecorder(): void {
    // Skip MediaRecorder setup if transcriptOnly mode is enabled
    if (this.transcriptOnly) {
      log.debug("Skipping MediaRecorder setup (transcriptOnly mode)");
      return;
    }

    if (!this.mediaDestination) {
      throw new Error("Media destination not initialized");
    }
    const stream = this.mediaDestination.stream;

    try {
      const options: MediaRecorderOptions = {};
      if (this.mediaMimeType) {
        options.mimeType = this.mediaMimeType;

        // For Opus codec, explicitly set bitrate for consistent quality
        // 96kbps provides excellent speech quality with minimal CPU usage
        if (this.mediaMimeType.includes("opus")) {
          options.audioBitsPerSecond = 96000;
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, options);

      log.debug("MediaRecorder created", {
        mimeType: this.mediaMimeType,
        audioBitsPerSecond: options.audioBitsPerSecond,
      });
    } catch (error) {
      log.error("Failed to create MediaRecorder", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    this.mediaRecorder.ondataavailable = async (event) => {
      try {
        if (!event.data || event.data.size === 0) return;
        // Last line of defence for the pause window: tracks are muted on
        // pause, but a chunk encoded from audio captured just before that
        // can still be delivered afterwards. Not gated on isRecording —
        // stopRecording() clears it before flushing the final chunk.
        if (this.isPaused) return;
        const arrayBuffer = await event.data.arrayBuffer();
        const encoded = new Uint8Array(arrayBuffer);
        this.encodedDataCallback?.(encoded);
        // Update stats
        this.markDataFlow();
        this.lastEncodedChunkAt = Date.now();
        if (this.encodedStallSince > 0) {
          log.warn("MediaRecorder encoded data resumed after stall", {
            stalledMs: Date.now() - this.encodedStallSince,
          });
          this.callbacks.onRecoveryLog?.(
            "Encoded audio data resumed after a capture stall.",
          );
          this.encodedStallSince = 0;
        }
        this.processedFrames++;
      } catch (e) {
        log.error("ondataavailable processing error", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };

    this.mediaRecorder.onerror = (e) => {
      log.error("MediaRecorder error", {
        error:
          e?.error?.message ?? (e instanceof Error ? e.message : String(e)),
      });
      this.callbacks.onWorkletError?.(String(e?.error?.message || e));
    };

    // Start with configured timeslice (default 10s; for streaming we pass lower from caller)
    try {
      const slice = this.mediaTimesliceMs ?? 10000;
      if (slice && slice > 0) this.mediaRecorder.start(slice);
      else this.mediaRecorder.start();
      this.lastEncodedChunkAt = Date.now();
    } catch (e) {
      log.error("Failed to start MediaRecorder", {
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }

  // ===== Stability monitoring (device topology + dead-air detection) =====

  private startStabilityMonitoring(): void {
    // Every rung action reports its outcome back: "blocked" refunds the
    // budget (no-ops must not exhaust the ladder or arm the restart rung),
    // "recovered" opens the tracker's floor-verification window so a
    // noise-cancelling gate that reads as dead air calibrates instead of
    // churning the device.
    this.silenceTracker = new SilenceTracker({
      reacquireMicrophone: (reason) =>
        void this.reacquireMicrophone(reason, {
          fallbackToAnyLiveInput: true,
        }).then((outcome) =>
          this.silenceTracker?.noteReacquireOutcome("microphone", outcome),
        ),
      reacquireSystemAudio: (reason) =>
        void this.reacquireSystemAudio(reason).then((outcome) =>
          this.silenceTracker?.noteReacquireOutcome("mix", outcome),
        ),
      restartAudioGraph: (reason) =>
        void this.recoverAudioGraphAfterDataStall(reason),
      log: (message) => this.callbacks.onRecoveryLog?.(message),
    });

    this.deviceWatcher = new DeviceWatcher((change) =>
      this.handleDeviceTopologyChange(change),
    );
    void this.deviceWatcher.start();
  }

  private stopStabilityMonitoring(): void {
    this.deviceWatcher?.stop();
    this.deviceWatcher = null;
    this.silenceTracker = null;
  }

  /**
   * Feed per-source levels to the dead-air ladder on the 5s health tick.
   * Complements the data-stall watchdog: a dead Windows endpoint keeps
   * delivering frames on schedule (so lastDataTime stays fresh) whose
   * content is silence — only the level reveals the failure.
   *
   * Frozen (not reset) while the graph is mid-rebuild: analysers are null
   * during teardown, and sampling them would erase the episode and restart
   * backoff that the rebuild was fired from. Timing uses performance.now()
   * — a wall-clock step (NTP, resume) must not warp ladder schedules.
   */
  private sampleDeadAir(): void {
    if (!this.silenceTracker || this.isStopping) return;
    if (this.graphRecoveryInProgress) return;
    this.silenceTracker.sample(this.sampleSourceLevels(), performance.now());
  }

  private sampleSourceLevels(): DeadAirLevels {
    // Mixed graph: per-branch analysers plus the post-mix analyser. A gated
    // mic reads as silence by design, so it reports no level and marks the
    // sample gated — the tracker keeps driving system re-acquisition off the
    // (now system-only) mix but suspends the graph-restart rung, since a low
    // mix can't tell a dead pipeline from a quiet meeting while gated.
    if (this.micAnalyserNode && this.micAnalyserBuffer) {
      return {
        micDb: this.micMuted ? null : this.getMicDb(),
        systemDb:
          this.systemAnalyserNode && this.systemAnalyserBuffer
            ? this.getSystemDb()
            : null,
        mixDb:
          this.analyserNode && this.analyserBuffer
            ? this.computeRmsDb(this.analyserNode, this.analyserBuffer)
            : null,
        micGated: this.micMuted,
      };
    }

    // Single-source graph: the main analyser reads the (gated) microphone.
    return {
      micDb:
        !this.micMuted && this.analyserNode && this.analyserBuffer
          ? this.computeRmsDb(this.analyserNode, this.analyserBuffer)
          : null,
      systemDb: null,
      mixDb: null,
      micGated: this.micMuted,
    };
  }

  private handleDeviceTopologyChange(change: DeviceTopologyChange): void {
    if (!this.isRecording || this.isStopping) return;

    this.recoveryCounters.deviceChange++;
    const description = describeTopologyChange(change);
    log.info("Audio device topology changed", { description });
    this.callbacks.onRecoveryLog?.(`Audio devices changed: ${description}`);
    this.silenceTracker?.noteTopologyChange();

    void this.revalidateMicrophoneAfterTopologyChange(change);
    void this.revalidateSystemAudioAfterTopologyChange(change);
  }

  private async revalidateMicrophoneAfterTopologyChange(
    change: DeviceTopologyChange,
  ): Promise<void> {
    const micTrack = this.getPrimaryMicTrack();
    if (!micTrack) return;

    const reason = microphoneReacquireReason(change, {
      currentDeviceId: micTrack.getSettings().deviceId,
      trackLabel: stripPseudoPrefix(micTrack.label),
      preferredDeviceId: this.preferredDeviceId,
    });
    if (!reason) return;

    await this.reacquireMicrophone(reason, {
      cooldownMs: AudioRecorder.DEVICE_CHANGE_REACQUIRE_COOLDOWN_MS,
    });
  }

  private async revalidateSystemAudioAfterTopologyChange(
    change: DeviceTopologyChange,
  ): Promise<void> {
    const reason = systemAudioReacquireReason(change);
    if (!reason) return;

    await this.reacquireSystemAudio(reason, {
      cooldownMs: AudioRecorder.DEVICE_CHANGE_REACQUIRE_COOLDOWN_MS,
    });
  }

  /**
   * Stability diagnostics for the heartbeat: dead-air durations, recovery
   * counters, and live track state.
   */
  getStabilityDiagnostics(): {
    micDeadAirSec: number;
    systemDeadAirSec: number;
    mixDeadAirSec: number;
    micDeadThresholdDb: number;
    mixDeadThresholdDb: number;
    pcmDb: number;
    pcmAgeMs: number;
    pcmNonFiniteCount: number;
    encodedAgeMs: number;
    encodedStalls: number;
    audioClockRatio: number | null;
    audioClockSlowSec: number;
    audioClockSlowEpisodes: number;
    audioLatencyHint: AudioContextLatencyCategory;
    audioBaseLatencyMs: number | null;
    micRecoveries: number;
    systemRecoveries: number;
    graphRecoveries: number;
    deviceChanges: number;
    micTrackLabel: string;
    micTrackState: string;
    micTrackMuted: boolean;
    systemTrackLabel: string;
    systemTrackState: string;
    systemTrackMuted: boolean;
  } {
    const tracker = this.silenceTracker;
    const now = performance.now();
    const clockRatio = this.audioClockMonitor.getRatio();
    const micTrack = this.getPrimaryMicTrack();
    const systemTrack = this.systemStream?.getAudioTracks()[0];
    return {
      micDeadAirSec: tracker?.getDeadAirSec("microphone", now) ?? 0,
      // System dead-air is often legitimate (nothing playing produces exact
      // zeros) — telemetry only, never a recovery trigger by itself.
      systemDeadAirSec: tracker?.getDeadAirSec("system", now) ?? 0,
      mixDeadAirSec: tracker?.getDeadAirSec("mix", now) ?? 0,
      // Thresholds below the -100 default reveal a session-calibrated
      // noise-cancelling gate (see silence-tracker.ts).
      micDeadThresholdDb:
        tracker?.getDeadThresholdDb("microphone") ?? EFFECTIVELY_DEAD_DB,
      mixDeadThresholdDb:
        tracker?.getDeadThresholdDb("mix") ?? EFFECTIVELY_DEAD_DB,
      // PCM output leg (worklet output, pre-conversion/transport). Healthy
      // mic/system/mix levels with a dead pcmDb isolate a worklet/resample
      // fault; a non-zero pcmNonFiniteCount means the worklet sanitized
      // samples that would have silenced the stream permanently. pcmDb is a
      // level over a past window, so it stays healthy-looking if chunks stop
      // outright — pcmAgeMs (0 = never started) is what proves liveness.
      pcmDb: this.getPcmDb(),
      pcmAgeMs: this.lastPcmChunkAt > 0 ? Date.now() - this.lastPcmChunkAt : 0,
      pcmNonFiniteCount: this.pcmNonFiniteCount,
      // Liveness of the encoded (MediaRecorder) leg — the bytes that become
      // the uploaded file.
      encodedAgeMs:
        this.lastEncodedChunkAt > 0 ? Date.now() - this.lastEncodedChunkAt : 0,
      encodedStalls: this.encodedStallCount,
      // Render clock vs wall clock over the last 5s window (null until
      // measured) and the session's total time rendering below real time.
      // Anything slow here was dropped from both the stream and the file.
      audioClockRatio:
        clockRatio === null ? null : Number(clockRatio.toFixed(3)),
      audioClockSlowSec: Math.round(this.audioClockMonitor.getSlowSec()),
      // Episodes of two or more slow windows; many short ones in a session
      // is a machine hovering at the line, one long one is a sustained stall.
      audioClockSlowEpisodes: this.audioClockMonitor.getEpisodes(),
      // The flag arm, and the device buffer it bought: the render thread's
      // deadline per callback, which bounds how late it can wake without
      // dropping audio. Null before the context exists.
      audioLatencyHint: this.latencyHint,
      audioBaseLatencyMs: this.audioContext
        ? Math.round(this.audioContext.baseLatency * 10000) / 10
        : null,
      micRecoveries: this.recoveryCounters.microphone,
      systemRecoveries: this.recoveryCounters.system,
      graphRecoveries: this.recoveryCounters.graph,
      deviceChanges: this.recoveryCounters.deviceChange,
      micTrackLabel: micTrack?.label ?? "",
      micTrackState: micTrack?.readyState ?? "none",
      micTrackMuted: micTrack?.muted ?? false,
      systemTrackLabel: systemTrack?.label ?? "",
      systemTrackState: systemTrack?.readyState ?? "none",
      systemTrackMuted: systemTrack?.muted ?? false,
    };
  }

  /**
   * Current default input/output device labels. Puts the endpoint's name in
   * the heartbeat so a post-mortem can see exactly which device the OS was
   * routing to before and after a failure.
   */
  async getCurrentDeviceLabels(): Promise<{
    defaultInputLabel: string;
    defaultOutputLabel: string;
    communicationsInputLabel: string;
    communicationsOutputLabel: string;
    audioInputCount: number;
    audioOutputCount: number;
  } | null> {
    const snapshot = await this.deviceWatcher?.refreshSnapshot();
    if (!snapshot) return null;
    return {
      defaultInputLabel: snapshot.defaultInputLabel,
      defaultOutputLabel: snapshot.defaultOutputLabel,
      communicationsInputLabel: snapshot.communicationsInputLabel,
      communicationsOutputLabel: snapshot.communicationsOutputLabel,
      audioInputCount: snapshot.inputs.length,
      audioOutputCount: snapshot.outputs.length,
    };
  }

  // ===== Health monitoring (data-flow watchdog) =====

  /**
   * Log when the context starts or stops rendering slower than real time.
   * Frames keep flowing at the reduced rate, so no data-stall watchdog fires.
   * While the context is not running (suspended, or mid-rebuild) the
   * baseline is dropped, so time spent not rendering is not scored as slow.
   *
   * Only the first few episodes are logged. A machine that hovers around the
   * slow line for a whole meeting is described by the heartbeat's
   * audioClockSlowSec and audioClockSlowEpisodes; logging every episode made
   * this the noisiest line the recorder wrote.
   */
  private sampleAudioClock(): void {
    const context = this.audioContext;
    if (!context || context.state !== "running") {
      this.audioClockMonitor.reset();
      return;
    }

    const transition = this.audioClockMonitor.sample(
      context,
      context.currentTime,
      performance.now(),
    );
    if (!transition) return;
    if (transition.episode > AudioRecorder.MAX_LOGGED_CLOCK_EPISODES) return;

    const ratio = Number(transition.ratio.toFixed(3));
    if (transition.kind === "slow") {
      log.warn("AudioContext is rendering slower than real time", {
        ratio,
        episode: transition.episode,
        sampleRate: context.sampleRate,
        baseLatency: context.baseLatency,
      });
      return;
    }

    log.info("AudioContext is rendering in real time again", {
      ratio,
      episode: transition.episode,
      slowForSec: Math.round(transition.slowForSec),
    });
  }

  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      if (!this.isRecording || this.isPaused) return;

      this.sampleDeadAir();
      this.sampleAudioClock();

      const now = Date.now();
      const timeSinceData = now - this.lastDataTime;
      const slice = this.mediaTimesliceMs ?? 10000;

      if (
        this.mediaRecorder &&
        !this.transcriptOnly &&
        slice > 0 &&
        this.lastEncodedChunkAt > 0
      ) {
        const timeSinceEncoded = now - this.lastEncodedChunkAt;
        const encodedTimeoutMs = Math.max(this.dataTimeoutMs, slice * 3);
        if (timeSinceEncoded > encodedTimeoutMs) {
          if (this.encodedStallSince === 0) {
            this.encodedStallSince = this.lastEncodedChunkAt;
            this.encodedStallCount++;
            log.error("MediaRecorder stopped producing encoded audio", {
              timeSinceEncoded,
              timeSinceData,
              mediaRecorderState: this.mediaRecorder.state,
              contextState: this.audioContext?.state,
              visibilityState:
                typeof document !== "undefined"
                  ? document.visibilityState
                  : "unknown",
              pcmAgeMs: this.lastPcmChunkAt > 0 ? now - this.lastPcmChunkAt : 0,
              micTrackState: this.getPrimaryMicTrack()?.readyState ?? "none",
              micTrackMuted: this.getPrimaryMicTrack()?.muted ?? false,
              stallCount: this.encodedStallCount,
            });
            this.callbacks.onRecoveryLog?.(
              "Recording capture stalled: encoder stopped producing audio data.",
            );
          }
          void this.recoverAudioGraphAfterDataStall(
            "encoded stream stalled",
            timeSinceEncoded,
          );
        }
      }

      if (timeSinceData > this.dataTimeoutMs) {
        log.info("No audio data for 30+ seconds", {
          timeSinceData,
          contextState: this.audioContext?.state,
        });
        void this.ensureAudioContextRunning();
        void this.recoverAudioGraphAfterDataStall(
          "normal data stall",
          timeSinceData,
        );
        return;
      }

      // PCM-leg watchdog: when MediaRecorder also runs, its chunks keep
      // lastDataTime fresh, so a silenced worklet never trips the shared
      // stall check above — watch the PCM stream's own timestamp too.
      if (!this.pcmDataCallback) return;

      const timeSincePcm = now - this.lastPcmChunkAt;
      const pcmStalled =
        this.pcmWorkletReady &&
        this.lastPcmChunkAt > 0 &&
        timeSincePcm > this.dataTimeoutMs;

      // A processor that crashes before reporting ready never sets the flag
      // the stall check above depends on, so without this the PCM leg has no
      // watchdog at all: the forced-recovery bypass is spent, normal recovery
      // is inside its cooldown, and nothing is left to ask again.
      const timeSinceInstalled = now - this.pcmWorkletInstalledAt;
      const workletNeverReady =
        !this.pcmWorkletReady &&
        this.pcmWorkletInstalledAt > 0 &&
        timeSinceInstalled > AudioRecorder.WORKLET_READY_TIMEOUT_MS;

      if (pcmStalled || workletNeverReady) {
        log.warn("PCM leg is not producing data", {
          reason: pcmStalled ? "stalled" : "never became ready",
          timeSincePcm,
          timeSinceInstalled,
          timeSinceData,
        });
        void this.recoverAudioGraphAfterDataStall(
          pcmStalled ? "PCM stream stalled" : "PCM worklet never became ready",
          pcmStalled ? timeSincePcm : timeSinceInstalled,
        );
      }
    }, 5000);
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    this.stopMeteringTimers();
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === "visible" && this.isRecording) {
      void this.ensureAudioContextRunning();
    }
  };

  private async cleanup(): Promise<void> {
    try {
      this.stopStabilityMonitoring();
      // No context is being measured any more, and the monitor must not
      // keep the closed one reachable.
      this.audioClockMonitor.reset();
      this.clearTrackMuteTimers();
      this.clearDataFlowDeadline();
      this.disconnectAudioNodes();
      this.stopActiveStreams();
      await this.closeAudioContext();
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          this.onVisibilityChange,
          false,
        );
      }

      log.debug("Cleanup complete");
    } catch (error) {
      log.error("Cleanup error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private startMetering(): void {
    if (!this.analyserNode) return;
    if (this.meterTimer) {
      clearInterval(this.meterTimer);
    }
    this.meterTimer = setInterval(() => {
      if (!this.isRecording || this.isPaused) return;
      if (!this.analyserNode || !this.analyserBuffer) return;
      try {
        // Ensure a regular ArrayBuffer-backed view
        if (
          !(this.analyserBuffer?.buffer instanceof ArrayBuffer) ||
          this.analyserBuffer.byteLength !== this.analyserNode!.fftSize * 4
        ) {
          this.analyserBuffer = new Float32Array(
            Number(this.analyserNode!.fftSize),
          );
        }
        // Use any-cast to avoid TS generic mismatch across lib.dom versions
        if (this.analyserBuffer) {
          this.analyserNode?.getFloatTimeDomainData(this.analyserBuffer);
        }
        let sumSq = 0;
        for (let i = 0; i < this.analyserBuffer.length; i++) {
          const v = this.analyserBuffer[i];
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / Math.max(1, this.analyserBuffer.length));
        const db = 20 * Math.log10(Math.max(rms, 1e-12));
        this.currentMeterValue = db;
      } catch {
        // ignore metering errors
      }
    }, 4000);
  }
}

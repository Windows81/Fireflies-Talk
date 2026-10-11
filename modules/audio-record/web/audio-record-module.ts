import type { PermissionResponse } from "expo-modules-core";
import { NativeModule, PermissionStatus } from "expo-modules-core";
import type {
  AudioRecordModule,
  AudioRecordModuleEvents,
  RecordingContext,
  RecordingOptions,
  RecordingStatus,
} from "../types";
import type { AudioFileBuffer } from "./audio-file-buffer";
import {
  AudioRecorder,
  classifyMediaError,
  isMicrophoneAcquisitionError,
  type AudioSourceKind,
} from "./audio-recorder";
import { AudioStreamer } from "./audio-streamer";
import { AudioUploader } from "./audio-uploader";
import {
  RecordingState,
  STREAM_FAILURE_CODE,
  StreamingState,
} from "./constants";
// MP3 path removed for web
import { MediaRecorderFileBuffer } from "./media-recorder-file-buffer";
import { PCMFileBuffer } from "./pcm-file-buffer";
import { ElectronAudioStreamer } from "./electron-audio-streamer";
import { Logger } from "@/logger";
import { withTimeout } from "@/utils/promise";
import type { AppAPI, StreamingHealth } from "electron/src/types";

const PCM_STREAMING_CHUNK_BYTES = 2400;

/**
 * Deadlines for the teardown steps of stopRecording().
 *
 * Every one of those steps is best-effort cleanup that can hang rather than
 * fail: AudioContext/MediaRecorder teardown on a wedged capture device, a
 * blocked storage handle in endWrite(), an unanswered ipcRenderer.invoke().
 * They are bounded individually — not as one budget — so a stuck step can't
 * starve the ones after it, and so the `finally` that clears isRecording /
 * stopInProgress always runs. Without that, a single pending promise latches
 * the module: every later stop throws "stop is already in progress" and every
 * start throws "recording is already in progress", until the app restarts.
 */
const TEARDOWN_TIMEOUT_MS = {
  recorderStop: 5000,
  endWrite: 5000,
  loopbackDisable: 2000,
  /** How long the streamer may go without sending before it is abandoned. */
  streamDrainGrace: 3000,
  /** Ceiling on the drain regardless of progress. */
  streamDrainMax: 15000,
} as const;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface RecordingSession {
  recorder: AudioRecorder;
  buffer?: AudioFileBuffer; // WEBM file buffer (optional if transcriptOnly=true)
  pcmBuffer?: PCMFileBuffer; // PCM streaming buffer (when streaming enabled)
  streamer?: AudioStreamer | ElectronAudioStreamer;
  uploader?: AudioUploader;
  startTime: number;
  options: RecordingOptions;
  systemAudioEnabled: boolean; // Track if system audio loopback was actually enabled
  useCoreAudioTap: boolean; // Track if CoreAudioTap is being used (affects video constraint)
}

export class AudioRecordModuleWeb
  extends NativeModule<AudioRecordModuleEvents>
  implements AudioRecordModule
{
  // Error-code constants required by the AudioRecordModule contract. Values
  // mirror what the native modules actually reject with (Android's
  // ErrorCodes enum — note its exported ERR_NO_PERMISSION constant is
  // remapped to the input-unavailable code, but its reject path uses the
  // value below), so cross-platform comparisons in src/ behave identically.
  readonly ERR_NO_PERMISSION = "E_AUDIO_RECORD_NO_PERMISSION";
  readonly ERR_NO_IN_PROGRESS_RECORDING = "E_NO_IN_PROGRESS_RECORDING";
  readonly ERR_IN_PROGRESS_RECORDING = "E_IN_PROGRESS_RECORDING";
  readonly ERR_AUDIO_INPUT_UNAVAILABLE = "E_AUDIO_INPUT_NOT_AVAILABLE";
  readonly ERR_INTERNAL = "E_INTERNAL";
  readonly ERR_INVALID_STATE = "E_AUDIO_RECORD_INVALID_STATE";

  private state = RecordingState.INACTIVE;
  private streamingState = StreamingState.INACTIVE;
  private streamingError: string | null = null;
  private durationMillis = 0;
  private metering = 0;
  private isRecording = false;

  // Current session
  private session: RecordingSession | null = null;

  // User-selected microphone input device (undefined = system default).
  private preferredDeviceId?: string;

  // Timers and monitoring
  private statusUpdateTimer?: ReturnType<typeof setInterval>;
  private maxDurationTimer?: ReturnType<typeof setTimeout>;
  private context: RecordingContext = { fileUri: "", mimeType: "" };

  // Page visibility handling
  private isPageVisible = true;
  private visibilityChangeHandler?: () => void;

  // Resource management
  private cleanupInProgress = false;
  private initializationInProgress = false;

  // Pre-captured system audio stream override (bypasses getDisplayMedia self-exclusion)
  private systemAudioStreamOverride: MediaStream | null = null;

  // Mic state tracking (for sending initial state to streamer on connection)
  private lastKnownMicState: "on" | "off" = "off";
  private lastKnownMicTime = 0;

  // Recording-notice policy: set while the meeting is on a camera that carries
  // no recording badge. Kept here rather than only on the recorder so it
  // survives across sessions and is available to the heartbeat.
  private cameraNoticeMissing = false;
  private cameraNoticeDetail = "";
  private cameraNoticeSilencedAudio = false;

  // Set while the user's voice is being dictated to Talk instead of spoken to
  // the meeting. Held here so a recording that starts mid-dictation, or one
  // whose graph recovery rebuilds, comes up with the microphone already gated.
  private microphoneMuted = false;

  // Heartbeat
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private heartbeatIndex = 0;
  private readonly HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  // Loggers
  private recordLogger = new Logger("AudioRecord");
  private streamLogger = new Logger("Streaming");
  private healthLogger = new Logger("RecordingHealth");

  async startRecording(options: RecordingOptions): Promise<void> {
    // Validate state
    if (this.isRecording || this.initializationInProgress) {
      throw new Error("Recording is already in progress or initializing.");
    }

    this.initializationInProgress = true;

    // Closure-tracked state populated by the onMicReady hook below.
    // - systemAudioEnabled = true means "the Electron loopback handler was
    //   installed and needs to be torn down on stop/failure". It does NOT
    //   imply system audio actually mixed in (capture may still fail
    //   downstream — the recorder degrades to mic-only in that case).
    let systemAudioEnabled = false;
    let useCoreAudioTap = false;

    const wantsSystemAudio = !!(options.enableSystemAudio && this.isDesktop());

    // Post-mic hook: install the Electron loopback handler AFTER we hold the
    // mic endpoint. Enabling it before mic acquisition races with the mic
    // open on Windows 11 25H2 and surfaces as NotReadableError.
    const onMicReady = wantsSystemAudio
      ? async (): Promise<{ useCoreAudioTap: boolean } | null> => {
          try {
            const loopback = await this.enableSystemAudioLoopback({
              loopbackAllDevices:
                options.systemAudioLoopbackAllDevices === true,
            });
            systemAudioEnabled = true;
            useCoreAudioTap = loopback.useCoreAudioTap;
            return { useCoreAudioTap: loopback.useCoreAudioTap };
          } catch (loopbackError) {
            // Loopback enable failed (e.g., permission denied on macOS).
            // Tell the recorder to fall back to mic-only.
            const message =
              loopbackError instanceof Error
                ? loopbackError.message
                : String(loopbackError);
            this.emit("log", {
              message: `System audio unavailable: ${message}. Recording with microphone only.`,
            });
            return null;
          }
        }
      : undefined;

    // Tear-down hook for when onMicReady succeeded (loopback handler is
    // installed) but system-audio capture fails downstream. Without this
    // the display-media handler would stay live for the entire mic-only
    // session and could affect any other capture path in the renderer.
    //
    // Only clear the closure flag when the IPC actually succeeded. If the
    // disable fails, leave systemAudioEnabled=true so stopRecording /
    // emergencyCleanup will retry the teardown — otherwise the handler
    // could persist for the entire renderer lifetime.
    const onSystemAudioUnavailable = wantsSystemAudio
      ? async (): Promise<void> => {
          const disabled = await this.disableSystemAudioLoopback();
          if (disabled) {
            systemAudioEnabled = false;
            useCoreAudioTap = false;
          }
        }
      : undefined;

    // Hoist buffer references outside the try so the catch can dispose of
    // them when startup fails before `this.session` is assigned.
    // AudioFileBuffer starts a healthCheckTimer in its constructor and a
    // cleanupTimer when streaming is enabled, so unreferenced buffers leak
    // setInterval handles for the lifetime of the renderer.
    let audioBuffer: AudioFileBuffer | undefined;
    let pcmBuffer: PCMFileBuffer | undefined;
    let sessionBuilt = false;

    try {
      // Storage setup (fast, idempotent — keep before recorder so disk
      // errors surface before we acquire any audio endpoint).
      await this.setupStorage();

      // Determine if we need streaming
      const needsStreaming =
        !options.useUploader && options.socketAuthToken && options.socketUrl;

      // Create PCM buffer for streaming (if needed).
      // PCM is always resampled to 24kHz for backend compatibility.
      if (needsStreaming) {
        pcmBuffer = new PCMFileBuffer({
          readChunkSize: PCM_STREAMING_CHUNK_BYTES,
          streamingEnabled: true,
        });
      }

      // Create WEBM file buffer (unless transcriptOnly mode)
      if (!options.transcriptOnly) {
        audioBuffer = await this.createAudioBuffer(options);
      }

      // Create and configure audio recorder. Pass the INTENT to capture
      // system audio plus the onMicReady hook — actual loopback enable
      // happens inside startRecording() between mic and system acquisition.
      const audioRecorder = await this.createAudioRecorder(
        audioBuffer,
        pcmBuffer,
        options,
        wantsSystemAudio,
        onMicReady,
        onSystemAudioUnavailable,
      );

      // Start the actual recording. The recorder will invoke onMicReady
      // after the mic stream is held.
      await audioRecorder.startRecording();

      // Policy changes during the async start never reached the recorder —
      // the session is not published yet — so reapply the latest values.
      audioRecorder.setSilenced(this.cameraNoticeSilencedAudio);
      audioRecorder.setMicrophoneMuted(this.microphoneMuted);

      // Build session AFTER startRecording — by now the closure has been
      // populated and we know whether loopback was installed.
      this.session = {
        recorder: audioRecorder,
        buffer: audioBuffer,
        pcmBuffer,
        startTime: Date.now(),
        options,
        systemAudioEnabled,
        useCoreAudioTap,
      };
      sessionBuilt = true;

      // Setup streaming if needed (use PCM buffer)
      if (needsStreaming && pcmBuffer) {
        await this.setupStreaming(options, pcmBuffer);
        const streamer = this.session?.streamer;
        if (streamer instanceof ElectronAudioStreamer) {
          streamer.sendMicActivity([
            { time: this.lastKnownMicTime, micState: this.lastKnownMicState },
          ]);
        }
      }

      // Update state
      this.isRecording = true;
      // Claim module-wide state. A stop that is still unwinding — release()
      // may have run from the streamer's completion callback while its later
      // steps were still awaiting IPC — no longer owns these flags, so its
      // trailing writes are ignored from here on. stopInProgress is cleared
      // outright: a superseded stop will never clear it itself, and leaving
      // it set would make THIS session's stop throw "already in progress".
      this.sessionSequence++;
      this.stopInProgress = false;
      this.updateStatus({
        state: RecordingState.RECORDING,
        streamingError: "",
      });

      this.recordLogger.info("recording started", {
        meetingId: this.sessionMeetingId(),
        sampleRate: options.sampleRate,
        systemAudioEnabled,
        streamingEnabled: !!needsStreaming,
      });

      // Start monitoring
      this.startMonitoring();
      this.startHeartbeat();
      this.setupPageVisibilityDetection();
      this.startMaxDurationTimer(options);

      this.emit("log", {
        message: `Recording started successfully (${options.sampleRate}Hz, ${options.bitRate || 128000}bps)`,
      });
    } catch (error) {
      // Tear down the loopback handler if onMicReady got far enough to
      // install it. emergencyCleanup() also covers this when a session
      // exists, but we may fail before the session is built.
      if (systemAudioEnabled) {
        try {
          await this.disableSystemAudioLoopback();
        } catch (cleanupError) {
          this.recordLogger.warn(
            "Failed to disable loopback during startRecording recovery",
            {
              error:
                cleanupError instanceof Error
                  ? cleanupError.message
                  : String(cleanupError),
            },
          );
        }
      }

      // If the session was never built, emergencyCleanup() can't reach the
      // local audioBuffer/pcmBuffer references — dispose them here so their
      // setInterval timers don't leak.
      if (!sessionBuilt) {
        if (audioBuffer) {
          try {
            audioBuffer.cleanup();
          } catch (cleanupError) {
            this.recordLogger.warn(
              "Failed to cleanup audioBuffer during startRecording recovery",
              {
                error:
                  cleanupError instanceof Error
                    ? cleanupError.message
                    : String(cleanupError),
              },
            );
          }
        }
        if (pcmBuffer) {
          try {
            pcmBuffer.cleanup();
          } catch (cleanupError) {
            this.recordLogger.warn(
              "Failed to cleanup pcmBuffer during startRecording recovery",
              {
                error:
                  cleanupError instanceof Error
                    ? cleanupError.message
                    : String(cleanupError),
              },
            );
          }
        }
      }

      // Cleanup partial initialization
      await this.emergencyCleanup();

      // Classify the error so the UI can show a useful message instead of
      // Chromium's opaque "Could not start audio source".
      const classified = isMicrophoneAcquisitionError(error)
        ? { code: error.code, message: error.message }
        : classifyMediaError(error);

      const userMessage =
        classified.code === "E_INIT_FAILED"
          ? `Failed to start recording: ${classified.message}`
          : classified.message;

      this.recordLogger.error("recording start failed", {
        meetingId: this.context.meetingId,
        operation: "start",
        errorCode: classified.code,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      this.emit("error", {
        code: classified.code,
        message: userMessage,
      });

      throw error;
    } finally {
      this.initializationInProgress = false;
    }
  }

  private stopInProgress = false;
  /** Set while stopRecording() waits for the streamer to release the session. */
  private sessionReleaseSignal: (() => void) | null = null;
  /**
   * Incremented every time a start claims the module; identifies who owns the
   * module-wide recording state (isRecording, stopInProgress, status).
   */
  private sessionSequence = 0;

  async stopRecording(): Promise<{ uri: string }> {
    if (!this.isRecording || !this.session) {
      throw new Error("Recording is not in progress.");
    }

    // Guard against concurrent stop calls (e.g., manual stop + maxDuration + streamCompleted race)
    if (this.stopInProgress) {
      throw new Error("Recording stop is already in progress.");
    }
    this.stopInProgress = true;
    this.stopHeartbeat();

    this.clearMaxDurationTimer();
    const uri = this.context.fileUri;
    const session = this.session;
    const sequence = this.sessionSequence;
    const wasUsingSystemAudio = session.systemAudioEnabled;

    try {
      // Stop audio capture. Unlike the steps below, a failure here means the
      // capture graph may still be live, so it is not swallowed.
      await withTimeout(
        Promise.resolve(session.recorder?.stopRecording()),
        TEARDOWN_TIMEOUT_MS.recorderStop,
        "recorder.stopRecording",
      );

      // Finalize buffers (this saves any remaining data and signals completion)
      // Guard against "Writing has already ended" errors from race conditions
      await this.endBufferWrite("Buffer", session.buffer);
      await this.endBufferWrite("PCM buffer", session.pcmBuffer);

      // endWrite() closed the streaming buffer, so the streamer drains what is
      // left and releases the session itself. Wait for that here rather than
      // returning while it is still in flight — see awaitSessionRelease().
      await this.awaitSessionRelease(session);

      // Disable system audio loopback if it was enabled. Electron's
      // display-media handler is process-global and this runs after
      // release() has already freed the module, so a stop that has been
      // superseded would be tearing down the LIVE session's handler — its
      // system audio would go silent mid-recording. The next stop disables it.
      if (wasUsingSystemAudio && this.stillOwnsModule(sequence)) {
        await this.disableSystemAudioLoopback();
      }

      // Log final stats
      const stats = session.buffer?.getStats();
      if (stats) {
        this.emit("log", {
          message: `Recording stopped: ${stats.totalChunks} chunks, ${(stats.totalBytes / 1024 / 1024).toFixed(2)}MB, ${stats.duration.toFixed(1)}s`,
        });
      }

      this.recordLogger.info("recording stopped", {
        meetingId: this.context.meetingId,
        durationSec: session.recorder?.getCurrentDuration() ?? 0,
        encodedBytesWritten: session.buffer?.fileSize ?? 0,
        pcmBytesWritten: session.pcmBuffer?.fileSize ?? 0,
      });

      if (this.stillOwnsModule(sequence)) {
        this.updateStatus({
          state: RecordingState.INACTIVE,
          durationMillis: 0,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordLogger.error("recording stop failed", {
        meetingId: this.context.meetingId,
        operation: "stop",
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });
      this.emit("error", {
        code: "E_STOP_FAILED",
        message: `Failed to stop recording: ${message}`,
      });

      // Force cleanup even on error
      await this.emergencyCleanup();
      throw error;
    } finally {
      if (this.stillOwnsModule(sequence)) {
        this.isRecording = false;
        this.stopInProgress = false;
      } else {
        this.recordLogger.info(
          "skipped trailing stop writes for a past session",
          {
            sequence,
            current: this.sessionSequence,
          },
        );
      }
    }

    return { uri };
  }

  /**
   * True while `sequence` is still the live recording.
   *
   * awaitSessionRelease() returns as soon as release() has run, and release()
   * clears isRecording — so the steps after it (loopback disable, final
   * status) run with the module already free for the next recording to claim.
   * Writing isRecording/status unconditionally after that point would mark a
   * LIVE session as stopped: its own stopRecording() would throw "Recording is
   * not in progress" and the UI would show idle over a hot mic.
   */
  private stillOwnsModule(sequence: number): boolean {
    return sequence === this.sessionSequence;
  }

  /**
   * Close a buffer for writing. Bounded and never throwing: the tail chunk is
   * worth a few seconds of patience, never a stuck recorder.
   */
  private async endBufferWrite(
    label: string,
    buffer: AudioFileBuffer | undefined,
  ): Promise<void> {
    if (!buffer) return;
    try {
      await withTimeout(
        buffer.endWrite(),
        TEARDOWN_TIMEOUT_MS.endWrite,
        `${label} endWrite`,
      );
    } catch (error) {
      this.emit("log", {
        message: `${label} endWrite warning: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Wait for the session to be released, then force it if it isn't.
   *
   * A streaming session normally releases itself: endWrite() flips the buffer
   * to "not writing", the streamer sends what's left, and its completion
   * callback calls release(). That handshake can fail to arrive — the socket
   * is down at stop time (the send loop parks waiting for a reconnect that
   * ends nothing), or endWrite() was abandoned above with `writing` still set.
   *
   * A streamer that outlives its stop is not an idle leak. Its bridge
   * listeners are still attached, and the Electron streaming bridge is shared
   * process-wide: when the NEXT meeting connects, the stale streamer sees
   * CONNECTED, pushes the previous meeting's audio into the new socket and
   * then ends it. So the session is dropped here, inside stop, while a new
   * one cannot yet have started.
   */
  private async awaitSessionRelease(session: RecordingSession): Promise<void> {
    if (!session.streamer || this.session !== session) return;

    const released = new Promise<void>((resolve) => {
      this.sessionReleaseSignal = resolve;
    });
    const hardDeadline = Date.now() + TEARDOWN_TIMEOUT_MS.streamDrainMax;
    const sentBytes = () => session.pcmBuffer?.readOffset ?? 0;

    try {
      // Sampled before the first wait, so a streamer that never sends
      // anything is abandoned after one grace period rather than two.
      let lastSent = sentBytes();
      while (this.session === session) {
        const drained = await Promise.race([
          released.then(() => true),
          delay(TEARDOWN_TIMEOUT_MS.streamDrainGrace).then(() => false),
        ]);
        if (drained) return;

        // Still sending: a backlog built up during a reconnect legitimately
        // takes longer than the grace period, and cutting it would discard
        // that audio outright on transcript-only recordings, where the stream
        // IS the recording. Keep waiting while the cursor advances.
        const sent = sentBytes();
        if (sent === lastSent || Date.now() >= hardDeadline) break;
        lastSent = sent;
      }

      if (this.session !== session) return;
      this.emit("log", {
        message: "Streaming session did not complete on stop, releasing it",
      });
      this.release();
    } finally {
      this.sessionReleaseSignal = null;
    }
  }

  async pauseRecording() {
    if (!this.isRecording || !this.session) {
      throw new Error("Recording is not in progress.");
    }

    try {
      await this.session.recorder?.pauseRecording();
      this.updateStatus({ state: RecordingState.PAUSED });
      this.recordLogger.info("recording paused", {
        meetingId: this.context.meetingId,
      });
      this.emit("log", { message: "Recording paused" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordLogger.error("recording pause failed — stopping recording", {
        meetingId: this.context.meetingId,
        operation: "pause",
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });
      await this.stopRecordingOnFailure();
      this.emit("error", {
        code: "E_PAUSE_FAILED",
        message: `Failed to pause recording: ${message}`,
      });
      throw error;
    }
  }

  async resumeRecording() {
    if (!this.isRecording || !this.session) {
      throw new Error("Recording is not in progress.");
    }

    try {
      await this.session.recorder?.resumeRecording();
      this.updateStatus({ state: RecordingState.RECORDING });
      this.recordLogger.info("recording resumed", {
        meetingId: this.context.meetingId,
      });
      this.emit("log", { message: "Recording resumed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordLogger.error("recording resume failed — stopping recording", {
        meetingId: this.context.meetingId,
        operation: "resume",
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });
      await this.stopRecordingOnFailure();
      this.emit("error", {
        code: "E_RESUME_FAILED",
        message: `Failed to resume recording: ${message}`,
      });
      throw error;
    }
  }

  startUpload(uploadUrl: string) {
    const meetingId = this.context.meetingId;
    if (!meetingId) {
      throw new Error("Meeting ID is required.");
    }

    if (!this.session?.buffer) {
      this.emit("streamFailed", {
        meetingId,
        type: "uploader",
        code: "E_NO_BUFFER",
        message: "No audio buffer available for upload",
      });
      return;
    }

    try {
      this.updateStatus({
        streamingError: "",
        streamingStatus: StreamingState.CONNECTING,
      });

      const uploader = new AudioUploader(this.session.buffer, {
        log: (message) => {
          this.emit("log", { message });
        },
        onStreamStatusUpdate: (status) => {
          this.updateStatus({ streamingStatus: status });
        },
        onStreamCompleted: () => {
          this.emit("streamCompleted", { meetingId });
          this.release();
        },
        onStreamFailed: (error) => {
          this.emit("streamFailed", {
            meetingId,
            type: "uploader",
            code: "E_UPLOAD_FAILED",
            message: error,
          });
        },
        onStreamError: (error) => {
          this.emit("error", {
            code: "E_UPLOAD_ERROR",
            message: error,
          });
        },
      });

      uploader.startUpload(uploadUrl);
      this.session.uploader = uploader;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit("streamFailed", {
        meetingId,
        type: "uploader",
        code: "E_UPLOAD_INIT_FAILED",
        message,
      });
    }
  }

  release() {
    if (this.cleanupInProgress) return;

    this.cleanupInProgress = true;
    // Unblocks a stop that is waiting for the streamer to finish draining.
    this.sessionReleaseSignal?.();

    try {
      // Stop all monitoring
      this.stopMonitoring();
      this.stopHeartbeat();
      this.releaseProcessPowerPolicy();
      this.clearMaxDurationTimer();
      this.cleanupPageVisibilityDetection();

      // Detach the session BEFORE disposing it: a throwing disposer must not
      // leave the module holding a half-torn-down session and skip the state
      // reset below, which is what frees the recorder for the next start.
      const session = this.session;
      this.session = null;
      if (session) {
        this.disposeQuietly("streamer", () =>
          session.streamer?.stopStreaming(),
        );
        this.disposeQuietly("buffer", () => session.buffer?.cleanup());
        this.disposeQuietly("pcm buffer", () => session.pcmBuffer?.cleanup());
      }

      // Reset state
      this.updateStatus({
        state: RecordingState.INACTIVE,
        streamingStatus: StreamingState.INACTIVE,
        streamingError: "",
        durationMillis: 0,
        metering: 0,
      });

      this.isRecording = false;
      this.stopInProgress = false;

      this.emit("log", { message: "Recording session released" });
    } finally {
      this.cleanupInProgress = false;
    }
  }

  /** Run one teardown step; its failure must not abort the rest. */
  private disposeQuietly(label: string, dispose: () => void): void {
    try {
      dispose();
    } catch (error) {
      this.recordLogger.warn(`Failed to release ${label}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getStatus(): RecordingStatus {
    // For streaming progress, use PCM buffer if available, otherwise WEBM buffer
    const streamBuffer = this.session?.pcmBuffer || this.session?.buffer;

    return {
      state: this.state,
      durationMillis: this.durationMillis,
      metering: this.metering,
      streamingState: this.streamingState,
      fileSize: streamBuffer?.fileSize || 0,
      fileReadOffset: streamBuffer?.readOffset || 0,
      streamingError: this.streamingError,
    };
  }

  getContext(): RecordingContext {
    return this.context;
  }

  setContext(context: RecordingContext) {
    this.context = context;
  }

  setStreamingError(error: string) {
    this.updateStatus({ streamingError: error });
  }

  setSystemAudioStreamOverride(stream: MediaStream | null) {
    this.systemAudioStreamOverride = stream;
  }

  /**
   * Gates the microphone alone — system audio keeps recording — for as long as
   * the flag is set. Unlike `setCameraNotice`'s silence this is not a policy
   * on the recording but on one source, so the two never share a node.
   */
  setMicrophoneMuted(muted: boolean): void {
    if (this.microphoneMuted === muted) return;
    this.microphoneMuted = muted;
    this.session?.recorder.setMicrophoneMuted(muted);
  }

  isMicrophoneMuted(): boolean {
    return this.microphoneMuted;
  }

  /**
   * Records that the meeting moved onto — or off — a camera that shows no
   * recording notice, and applies whatever that costs the recording.
   *
   * `silenceAudio` drops every recorded sample without disturbing the session:
   * buffers, socket and duration keep running, so the recording simply contains
   * silence for as long as it is set. It is currently always false (the user is
   * warned instead), but the path stays wired and the state stays in the
   * heartbeat — "the transcript is empty" is otherwise indistinguishable from a
   * capture bug.
   */
  setCameraNotice(state: {
    missing: boolean;
    detail: string;
    silenceAudio: boolean;
  }): void {
    const detail = state.missing ? state.detail : "";

    // Compared in full rather than on the flag alone: a meeting that moves from
    // one unbadged camera to another keeps the flag set while changing which
    // camera is to blame, and a heartbeat naming the wrong one is worse for a
    // support ticket than naming none.
    if (
      this.cameraNoticeMissing === state.missing &&
      this.cameraNoticeDetail === detail &&
      this.cameraNoticeSilencedAudio === state.silenceAudio
    ) {
      return;
    }

    this.cameraNoticeMissing = state.missing;
    this.cameraNoticeDetail = detail;
    this.cameraNoticeSilencedAudio = state.silenceAudio;
    this.session?.recorder.setSilenced(state.silenceAudio);

    this.recordLogger.warn(
      state.missing
        ? "recording is on a camera with no recording notice"
        : "the recording notice is back on the meeting's camera",
      {
        meetingId: this.context.meetingId,
        cameras: state.detail,
        silencedAudio: state.silenceAudio,
      },
    );
  }

  async requestRecordingPermissions(): Promise<PermissionResponse> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      return {
        status: PermissionStatus.GRANTED,
        expires: "never",
        canAskAgain: true,
        granted: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit("log", { message: `Permission denied: ${message}` });

      return {
        status: PermissionStatus.DENIED,
        expires: "never",
        canAskAgain: true,
        granted: false,
      };
    }
  }

  // Private helper methods

  private async setupStorage(): Promise<void> {
    try {
      const { WebRecordingStorage } = await import("./web-recording-storage");

      // Request persistent storage
      const persistentGranted =
        await WebRecordingStorage.requestPersistentStorage();
      this.emit("log", {
        message: persistentGranted
          ? "Persistent storage granted"
          : "Persistent storage denied - recordings may be evicted",
      });

      // Check available space
      const storageInfo = await WebRecordingStorage.getStorageInfo();
      const availableMB = storageInfo.available / 1024 / 1024;

      if (availableMB < 100) {
        this.emit("log", {
          message: `Low storage warning: only ${availableMB.toFixed(2)}MB available`,
        });
      }

      this.emit("log", {
        message: `Storage: ${availableMB.toFixed(2)}MB available, ${storageInfo.usagePercentage.toFixed(1)}% used`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit("log", { message: `Storage setup failed: ${message}` });
      // Continue anyway - storage issues shouldn't block recording
    }
  }

  private async createAudioBuffer(
    options: RecordingOptions,
  ): Promise<AudioFileBuffer> {
    // Determine if streaming will be enabled for this session
    const streamingEnabled =
      !options.useUploader && !!options.socketAuthToken && !!options.socketUrl;

    const audioBuffer = new MediaRecorderFileBuffer({
      samplingRate: options.sampleRate ?? 48000,
      readChunkSize: 65536,
      mimeType: options.mimeType,
      fileUri: options.fileUri,
      streamingEnabled,
    });
    if (audioBuffer.getFileUri() && audioBuffer.getMimeType()) {
      await audioBuffer.initializeRecording();
    }
    return audioBuffer;
  }

  private async createAudioRecorder(
    audioBuffer: AudioFileBuffer | undefined,
    pcmBuffer: PCMFileBuffer | undefined,
    options: RecordingOptions,
    intentToCaptureSystemAudio: boolean,
    onMicReady?: () => Promise<{ useCoreAudioTap: boolean } | null>,
    onSystemAudioUnavailable?: () => Promise<void>,
  ): Promise<AudioRecorder> {
    const recorder = new AudioRecorder(
      options.sampleRate ?? 48000,
      {
        onTrackEnded: (source) => this.handleTrackEnded(source),
        onWorkletError: (error) => this.handleWorkletError(error),
        onMicStateChanged: (micState, time) =>
          this.handleMicStateChanged(micState, time),
        onRecoveryLog: (message) => this.handleRecoveryLog(message),
        onMicReady,
        onSystemAudioUnavailable,
      },
      {
        onEncodedChunk: audioBuffer
          ? async (encoded) => {
              try {
                await audioBuffer.writeEncodedChunk(encoded);
              } catch (error) {
                this.handleWriteError(error);
              }
            }
          : undefined,
        onPCMChunk: pcmBuffer
          ? async (pcmData) => {
              try {
                await pcmBuffer.writePCMChunk(pcmData);
              } catch (error) {
                this.handleWriteError(error);
              }
            }
          : undefined,
        mediaMimeType: options.mimeType,
        mediaTimesliceMs: 10000,
        enableSystemAudio: intentToCaptureSystemAudio,
        // useCoreAudioTap is resolved inside the recorder via onMicReady's
        // return value (we don't know it until loopback enable() resolves).
        // Default to false here; will be overridden when onMicReady fires.
        useCoreAudioTap: false,
        systemAudioStreamOverride: this.systemAudioStreamOverride ?? undefined,
        transcriptOnly: options.transcriptOnly ?? false,
        realtimeBufferMs: options.realtimeBufferMs ?? 0,
        latencyHint: options.playbackLatencyHint ? "playback" : "interactive",
      },
    );

    recorder.setPreferredInputDevice(this.preferredDeviceId);
    // A recording started while the policy already forbids audio must be
    // silent from its first sample, not from the first policy change after it.
    recorder.setSilenced(this.cameraNoticeSilencedAudio);
    recorder.setMicrophoneMuted(this.microphoneMuted);
    return recorder;
  }

  /**
   * Select the microphone input device. Persists the choice for the next
   * recording and, if a recording is in progress, switches it live.
   */
  async setInputDevice(deviceId: string): Promise<void> {
    this.preferredDeviceId = deviceId;
    const recorder = this.session?.recorder;
    if (!recorder) return;
    try {
      await recorder.switchInputDevice(deviceId);
    } catch (error) {
      this.recordLogger.error("Failed to switch input device", { error });
    }
  }

  private async setupStreaming(
    options: RecordingOptions,
    audioBuffer: AudioFileBuffer,
  ): Promise<void> {
    // Electron ignores this token (its main process resolves one per connection
    // attempt from the renderer); it still gates streaming on the user being
    // signed in, and the socket.io path streams with it.
    if (!options.socketAuthToken) {
      throw new Error("Auth token is required for streaming.");
    }
    if (!options.socketUrl) {
      throw new Error("Socket URL is required for streaming.");
    }

    // Get file extension type from buffer (e.g., "raw" for PCM, "webm" for WEBM)
    const fileExtensionType = audioBuffer.getBufferType();

    // Identity of the session these callbacks belong to. A streamer can
    // outlive its session (a reconnect that resolves late, a completion event
    // arriving after teardown), and the callbacks below act on module-wide
    // state — so they check what they own rather than what is current.
    const owningSession = this.session;
    if (!owningSession) {
      throw new Error("Cannot set up streaming without a recording session.");
    }

    const streamerCallbacks = {
      log: (message: string) => {
        this.emit("log", { message });
      },
      onStreamStatusUpdate: (status: StreamingState) => {
        this.updateStatus({ streamingStatus: status });
        this.streamLogger.info("streaming state changed", {
          meetingId: options.meetingId,
          state: status,
        });
      },
      onStreamCompleted: () => {
        const streamer = owningSession.streamer;
        this.streamLogger.info("streaming completed", {
          meetingId: options.meetingId,
          totalStreamedBytes:
            streamer instanceof ElectronAudioStreamer
              ? streamer.streamedBytes
              : 0,
          totalStreamedChunks:
            streamer instanceof ElectronAudioStreamer
              ? streamer.streamedChunks
              : 0,
        });
        this.emit("streamCompleted", {
          meetingId: options.meetingId,
        });
        // release() tears down whatever session is current, so a completion
        // that arrives late — after this one ended and another started —
        // must not touch it.
        if (this.session !== owningSession) {
          this.streamLogger.info("ignoring completion from a past session", {
            meetingId: options.meetingId,
          });
          return;
        }
        this.stopMonitoring();
        this.release();
      },
      onStreamFailed: (error: string, code?: string) => {
        this.streamLogger.error("streaming failed", {
          meetingId: options.meetingId,
          error,
          code,
        });
        this.emit("streamFailed", {
          meetingId: options.meetingId,
          type: "streamer",
          code: code ?? STREAM_FAILURE_CODE.generic,
          message: error,
        });
      },
      onStreamError: (error: string) => {
        this.emit("error", {
          code: "E_STREAM_ERROR",
          message: error,
        });
      },
    };

    const streamer = this.isElectronStreamingAvailable()
      ? new ElectronAudioStreamer(
          options.socketUrl,
          options.meetingId,
          audioBuffer,
          streamerCallbacks,
          options.language,
          options.userId,
        )
      : new AudioStreamer(
          options.socketUrl,
          options.socketAuthToken,
          audioBuffer,
          streamerCallbacks,
          fileExtensionType,
        );

    this.session!.streamer = streamer;
  }

  /**
   * Maps MIME type to file extension type expected by the server.
   */
  private getFileExtensionFromMimeType(mimeType: string): string {
    const baseMimeType = mimeType.split(";")[0].toLowerCase();

    switch (baseMimeType) {
      case "audio/mp4":
      case "video/mp4":
        return "m4a";
      case "audio/webm":
      case "video/webm":
        return "webm";
      case "audio/ogg":
        return "ogg";
      case "audio/mpeg":
        return "mp3";
      default:
        // Default to webm since that's our primary format now
        return "webm";
    }
  }

  private isElectronStreamingAvailable(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(
      (window as typeof window & { electron?: { streaming?: unknown } })
        .electron?.streaming,
    );
  }

  private handleWriteError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    this.recordLogger.error("Audio write error", { error: String(error) });

    // Log warning - buffer will handle retries
    this.emit("log", {
      message: `Audio write warning: ${message}`,
    });
  }

  private handleMicStateChanged(micState: "on" | "off", time: number): void {
    this.lastKnownMicState = micState;
    this.lastKnownMicTime = time;
    this.emit("micStateChanged", { micState, time });

    const streamer = this.session?.streamer;
    if (streamer instanceof ElectronAudioStreamer) {
      streamer.sendMicActivity([{ time, micState }]);
    }
  }

  private handleTrackEnded(source: AudioSourceKind): void {
    this.recordLogger.warn(
      "Media track ended - recording may continue silent",
      {
        source,
      },
    );

    // MediaRecorder will continue recording silence - this is OK!
    // Allows user to reconnect the input without losing recording
    // Better UX than destroying the entire session

    this.emit("log", {
      message:
        source === "microphone"
          ? "⚠️ Microphone disconnected - recording silence. Reconnect your microphone to resume."
          : "⚠️ System audio capture stopped - recording may miss speaker audio.",
    });

    // Emit a non-fatal warning (not error) so UI can show notification
    // but don't kill the recording session
    this.emit("status", {
      ...this.getStatus(),
      // You could add a custom flag here if needed, like:
      // microphoneConnected: false
    });

    // NOTE: Recording continues! MediaRecorder will record silence.
    // If the input recovers, user can continue in same session.
    // If they want to stop, they can manually stop recording.
  }

  private handleWorkletError(error: string): void {
    this.recordLogger.error("Audio worklet error", { error });

    // Log worklet errors - AudioRecorder handles recovery internally
    this.emit("log", {
      message: `Audio worklet warning: ${error}`,
    });
  }

  private handleRecoveryLog(message: string): void {
    this.recordLogger.warn("Audio recovery event", { message });
    this.emit("log", { message });
  }

  private async stopRecordingOnFailure(): Promise<void> {
    try {
      if (this.isRecording && this.session) {
        await this.stopRecording();
      }
      this.release();
    } catch (stopError) {
      this.recordLogger.error("stopRecording failed during error recovery", {
        meetingId: this.context.meetingId,
        error:
          stopError instanceof Error ? stopError.message : String(stopError),
      });
      await this.emergencyCleanup();
    }
  }

  private async emergencyCleanup(): Promise<void> {
    this.emit("log", { message: "Emergency cleanup initiated" });

    try {
      this.stopHeartbeat();

      // Stop recording if active
      if (this.session?.recorder) {
        try {
          await withTimeout(
            this.session.recorder.stopRecording(),
            TEARDOWN_TIMEOUT_MS.recorderStop,
            "recorder.stopRecording",
          );
        } catch (error) {
          this.recordLogger.error(
            "Failed to stop recording during emergency cleanup",
            { error },
          );
        }
      }

      // End buffer write if possible
      await this.endBufferWrite("Buffer", this.session?.buffer);

      // Disable loopback if it was installed for this session. The IPC is
      // idempotent on the main process so this is safe to call defensively.
      if (this.session?.systemAudioEnabled) {
        try {
          await this.disableSystemAudioLoopback();
        } catch (error) {
          this.recordLogger.warn(
            "Failed to disable loopback during emergency cleanup",
            {
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }
      }
    } finally {
      this.release();
    }
  }

  private updateStatus({
    state,
    durationMillis,
    metering,
    streamingStatus,
    streamingError,
  }: {
    state?: RecordingState;
    durationMillis?: number;
    metering?: number;
    streamingStatus?: StreamingState;
    streamingError?: string;
  }) {
    if (typeof state === "string") {
      this.state = state;
    }
    if (typeof durationMillis === "number") {
      this.durationMillis = durationMillis;
    }
    if (typeof metering === "number") {
      this.metering = metering;
    }
    if (typeof streamingStatus === "string") {
      this.streamingState = streamingStatus;
    }
    if (typeof streamingError === "string") {
      this.streamingError = streamingError || null;
    }

    this.emit("status", this.getStatus());
  }

  private startMonitoring(): void {
    // Status updates every second
    if (!this.statusUpdateTimer) {
      this.statusUpdateTimer = setInterval(() => {
        this.onPeriodicStatusUpdate();
      }, 1000);
    }
  }

  private stopMonitoring(): void {
    if (this.statusUpdateTimer) {
      clearInterval(this.statusUpdateTimer);
      this.statusUpdateTimer = undefined;
    }
  }

  private startMaxDurationTimer(options: RecordingOptions): void {
    if (!options.maxDurationMs || options.maxDurationMs <= 0) return;
    this.clearMaxDurationTimer();
    this.emit("log", {
      message: `startMaxDurationTimer: ${options.maxDurationMs}ms`,
    });
    this.maxDurationTimer = setTimeout(
      () => this.onMaxDurationReached(),
      options.maxDurationMs,
    );
  }

  private clearMaxDurationTimer(): void {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = undefined;
    }
  }

  private async onMaxDurationReached(): Promise<void> {
    this.emit("log", { message: "onMaxDurationReached" });
    if (!this.isRecording) return;

    const meetingId = this.context.meetingId || "";

    try {
      await this.stopRecording();
    } catch (error) {
      this.emit("log", {
        message: `onMaxDurationReached: stopRecording error: ${error}`,
      });
    }

    this.emit("maxDurationReached", { meetingId });
  }

  private onPeriodicStatusUpdate(): void {
    if (this.state !== RecordingState.RECORDING || !this.session) {
      return;
    }

    const duration = (this.session.recorder?.getCurrentDuration() || 0) * 1000;
    const metering = this.session.recorder?.getCurrentMeter() || -Infinity;

    this.updateStatus({
      durationMillis: duration,
      metering,
    });

    // Optional: Detect sustained silence (possible mic disconnect)
    // If metering is -Infinity for extended period, mic is likely disconnected
    // You can use this to show UI warning without stopping recording
    if (metering === -Infinity && duration > 5000) {
      // Silent for 5+ seconds during active recording
      // Could emit a warning here if desired
    }
  }

  private startHeartbeat(): void {
    this.heartbeatIndex = 0;
    this.emitHeartbeat(); // heartbeatIndex: 0 = session start sentinel
    this.heartbeatTimer = setInterval(() => {
      this.heartbeatIndex++;
      this.emitHeartbeat();
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * The id of the recording in progress. The store publishes the context only
   * after startRecording resolves, so until then this.context still describes
   * the previous recording; the start options carry the current id.
   */
  private sessionMeetingId(): string {
    return this.session?.options.meetingId || this.context.meetingId || "";
  }

  /**
   * On battery, Windows throttles processes it takes for background work, and
   * a throttled renderer renders audio below real time, so the recording's
   * processes are opted out for its length. Re-applied from every heartbeat:
   * Chromium restarts the audio service, under a new pid, whenever it
   * crashes. Null off the desktop app and off Windows.
   */
  private applyRecordingPowerPolicy() {
    return this.readAppDiagnostic("power policy", (app) =>
      app.setRecordingPowerPolicy("unthrottled"),
    );
  }

  private releaseProcessPowerPolicy(): void {
    void this.readAppDiagnostic("power policy", (app) =>
      app.setRecordingPowerPolicy("default"),
    );
  }

  private async emitHeartbeat(): Promise<void> {
    if (!this.session) return;

    const meetingId = this.sessionMeetingId();
    const recorder = this.session.recorder;
    const streamer = this.session.streamer;
    const buffer = this.session.buffer;
    const pcmBuffer = this.session.pcmBuffer;

    // Streaming health (main-process IPC) and the device snapshot are
    // independent — fetch them in parallel. Device labels name the endpoint
    // the OS routes to, so the heartbeats before/after a route-change death
    // identify the device that moved.
    const [wsHealth, deviceLabels, windowPower, machine, powerPolicy] =
      await Promise.all([
        this.fetchStreamingHealth(),
        this.fetchDeviceLabels(recorder),
        this.readAppDiagnostic("window and power state", (app) =>
          app.getWindowPowerState(),
        ),
        this.readAppDiagnostic("process health", (app) =>
          app.getProcessHealth(),
        ),
        this.applyRecordingPowerPolicy(),
      ]);

    const stability = recorder?.getStabilityDiagnostics();

    this.healthLogger.info("heartbeat", {
      meetingId,
      heartbeatIndex: this.heartbeatIndex,

      // Recording health
      recordingDurationSec: recorder?.getCurrentDuration() ?? 0,
      recordingState: this.state,
      encodedBytesWritten: buffer?.fileSize ?? 0,
      pcmBytesWritten: pcmBuffer?.fileSize ?? 0,

      // Streaming health (renderer side)
      streamingState: this.streamingState,
      streamedBytes:
        streamer instanceof ElectronAudioStreamer ? streamer.streamedBytes : 0,
      streamedChunks:
        streamer instanceof ElectronAudioStreamer ? streamer.streamedChunks : 0,

      // Streaming health (main process)
      wsState: wsHealth?.wsState ?? "unknown",
      wsBytesSent: wsHealth?.wsBytesSent ?? 0,
      wsChunksSent: wsHealth?.wsChunksSent ?? 0,
      wsChunksFailed: wsHealth?.wsChunksFailed ?? 0,
      wsBytesDropped: wsHealth?.wsBytesDropped ?? 0,
      wsReconnectAttempts: wsHealth?.wsReconnectAttempts ?? 0,

      // Transcript production (main process): socket transcript messages,
      // sentences counted once at their latest length, and the time since
      // the last message. This is the end-to-end signal — speech on the
      // meters with no transcript for a whole interval is the failure every
      // other field only hints at.
      transcriptEvents: wsHealth?.transcriptEvents ?? 0,
      transcriptSegments: wsHealth?.transcriptSegments ?? 0,
      transcriptChars: wsHealth?.transcriptChars ?? 0,
      transcriptAgeMs: wsHealth?.transcriptAgeMs ?? null,

      // Recording-notice policy. Sits next to the audio health fields on
      // purpose: if audio is ever silenced for it, the levels below are the
      // live room while everything written to disk and the socket is silence,
      // and that pairing is the whole explanation for an empty transcript.
      cameraNoticeMissing: this.cameraNoticeMissing,
      cameraNoticeDetail: this.cameraNoticeDetail,
      cameraNoticeSilencedAudio: this.cameraNoticeSilencedAudio,
      microphoneMuted: this.microphoneMuted,

      // Audio health
      audioContextState: recorder?.getAudioContextState() ?? "unknown",
      micState: this.lastKnownMicState,
      meterDb: recorder?.getCurrentMeter() ?? -999,
      micDb: recorder?.getMicDb() ?? -999,
      systemDb: recorder?.getSystemDb() ?? -999,
      silenceDurationSec: recorder?.getSilenceDurationSec() ?? 0,

      // Dead-air (frames flowing but effectively silent), recovery activity,
      // and track + device topology state. Note systemDeadAirSec is often
      // legitimate silence (nothing playing produces exact zeros).
      ...(stability ?? {}),
      defaultInputLabel: deviceLabels?.defaultInputLabel ?? "",
      defaultOutputLabel: deviceLabels?.defaultOutputLabel ?? "",
      // Windows routes calls to the communications endpoint while loopback
      // captures the default one. When the two output labels differ, a
      // Teams or Zoom call is playing where the recorder is not listening.
      communicationsInputLabel: deviceLabels?.communicationsInputLabel ?? "",
      communicationsOutputLabel: deviceLabels?.communicationsOutputLabel ?? "",
      audioInputCount: deviceLabels?.audioInputCount ?? -1,
      audioOutputCount: deviceLabels?.audioOutputCount ?? -1,

      // Read next to audioClockRatio: conditions suspected of slowing it.
      windowState: windowPower?.windowState ?? null,
      onBatteryPower: windowPower?.onBatteryPower ?? null,
      // Windows power throttling of main, this renderer and the audio
      // service after the policy above was re-applied; null off the desktop
      // app. Read beside audioClockRatio and onBatteryPower to measure what
      // the opt-out buys.
      powerPolicy,
      // CPU and memory per process, free RAM and the OS build. Null outside
      // the desktop app.
      machine,
    });
  }

  /**
   * Read one of the desktop app's diagnostics. Null on the web, where there
   * is no bridge, and when the call fails, so no heartbeat is lost to it.
   */
  private async readAppDiagnostic<T>(
    label: string,
    read: (app: AppAPI) => Promise<T>,
  ): Promise<T | null> {
    const app =
      typeof window !== "undefined" ? window.electron?.app : undefined;
    if (!app) return null;
    try {
      return await read(app);
    } catch (error) {
      this.healthLogger.warn(`Failed to read ${label}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async fetchStreamingHealth(): Promise<StreamingHealth | null> {
    try {
      const streamingBridge =
        typeof window !== "undefined" ? window.electron?.streaming : undefined;
      if (!streamingBridge?.getHealth) return null;
      return await streamingBridge.getHealth();
    } catch (error) {
      this.healthLogger.warn("Failed to fetch streaming health via IPC", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async fetchDeviceLabels(
    recorder: AudioRecorder | undefined,
  ): Promise<Awaited<ReturnType<AudioRecorder["getCurrentDeviceLabels"]>>> {
    try {
      return (await recorder?.getCurrentDeviceLabels()) ?? null;
    } catch (error) {
      this.healthLogger.warn("Failed to fetch device labels", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private setupPageVisibilityDetection(): void {
    if (typeof window === "undefined") return;

    this.isPageVisible = !document.hidden;

    this.visibilityChangeHandler = async () => {
      const wasVisible = this.isPageVisible;
      this.isPageVisible = !document.hidden;

      if (this.isPageVisible && !wasVisible) {
        // Page became visible
        this.emit("log", { message: "Page became visible" });

        if (this.session && this.state === RecordingState.RECORDING) {
          // Just ensure AudioContext is running - NO reconnection
          await this.session.recorder?.ensureAudioContextRunning();

          // Update status immediately
          this.onPeriodicStatusUpdate();
        }
      } else if (!this.isPageVisible && wasVisible) {
        // Page became hidden - just log it
        this.emit("log", {
          message: "Page became hidden - recording continues",
        });
      }
    };

    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  private cleanupPageVisibilityDetection(): void {
    if (this.visibilityChangeHandler && typeof window !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler,
      );
      this.visibilityChangeHandler = undefined;
    }
  }

  /**
   * Check if running in Electron desktop environment
   */
  private isDesktop(): boolean {
    return typeof window !== "undefined" && Boolean(window.electron);
  }

  /**
   * Enable system audio loopback for desktop recording.
   * Checks permission status first and throws if not granted.
   * Returns config info including whether CoreAudioTap is being used.
   */
  private async enableSystemAudioLoopback(options: {
    loopbackAllDevices: boolean;
  }): Promise<{
    useCoreAudioTap: boolean;
  }> {
    if (!this.isDesktop()) {
      throw new Error(
        "System audio is only available in desktop (Electron) environment",
      );
    }

    const electron = (
      window as typeof window & {
        electron?: {
          audioLoopback?: {
            enable: (options: { loopbackAllDevices: boolean }) => Promise<{
              success: boolean;
              error?: string;
              permissionStatus?: string;
            }>;
            getConfig: () => Promise<{
              forceCoreAudioTap: boolean;
            }>;
          };
        };
      }
    ).electron;

    if (!electron?.audioLoopback) {
      throw new Error(
        "Audio loopback API not available. Please update your Electron app.",
      );
    }

    const result = await electron.audioLoopback.enable(options);

    if (!result.success) {
      // Permission not granted - throw so caller can fall back to mic-only
      const errorMsg =
        result.error || "System audio loopback failed (permission not granted)";
      this.emit("log", {
        message: `System audio unavailable: ${errorMsg}`,
      });
      throw new Error(errorMsg);
    }

    // Get the config to determine if CoreAudioTap is being used
    let useCoreAudioTap = false;
    try {
      const config = await electron.audioLoopback.getConfig();
      useCoreAudioTap = config.forceCoreAudioTap;
    } catch {
      // If getConfig fails, default to false (ScreenCaptureKit behavior)
      this.emit("log", {
        message:
          "Could not get audio loopback config, defaulting to ScreenCaptureKit mode",
      });
    }

    this.emit("log", {
      message: `System audio loopback enabled successfully (CoreAudioTap: ${useCoreAudioTap})`,
    });

    return { useCoreAudioTap };
  }

  /**
   * Disable system audio loopback after recording.
   *
   * Returns `true` when the handler is gone (either the IPC succeeded or
   * there was nothing to disable — not desktop, or the bridge isn't
   * exposed). Returns `false` when the IPC threw, meaning the Electron
   * `setDisplayMediaRequestHandler` may still be installed and a later
   * teardown should retry.
   *
   * Never throws — the contract is "best-effort cleanup" — but the boolean
   * lets callers track whether the loopback state is actually clear so
   * they don't prematurely drop their "needs teardown" flag.
   */
  private async disableSystemAudioLoopback(): Promise<boolean> {
    if (!this.isDesktop()) return true;

    const electron = (
      window as typeof window & {
        electron?: { audioLoopback?: { disable: () => Promise<void> } };
      }
    ).electron;
    if (!electron?.audioLoopback) return true;

    try {
      // Bounded: the renderer has no visibility into what the main process is
      // doing, and an invoke() that never settles would hold up the stop.
      await withTimeout(
        electron.audioLoopback.disable(),
        TEARDOWN_TIMEOUT_MS.loopbackDisable,
        "audioLoopback.disable",
      );
      this.emit("log", {
        message: "System audio loopback disabled",
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit("log", {
        message: `Warning: Failed to disable audio loopback: ${message}`,
      });
      return false;
    }
  }
}

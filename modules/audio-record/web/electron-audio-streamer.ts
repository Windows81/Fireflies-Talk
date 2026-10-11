import type { AudioFileBuffer } from "./audio-file-buffer";
import type { StreamerCallback } from "./audio-streamer";
import { STREAM_FAILURE_CODE, StreamingState } from "./constants";
import { withTimeout } from "@/utils/promise";

/** Code the streaming client attaches to a terminal auth rejection. */
const STREAMING_AUTH_FAILED = "STREAMING_AUTH_FAILED";

// Base retry interval when no data is ready or on transient errors.
const SEND_INTERVAL = 10;
const BYTES_PER_SAMPLE = 2;
const MIN_SEND_DELAY_MS = 5;
const END_STREAM_TIMEOUT_MS = 2000;
/** Ceiling for the send loop's failure backoff. */
const MAX_RETRY_INTERVAL = 2000;

type StreamingError = {
  message: string;
  code?: string;
  terminal: boolean;
};

type StreamingBridge = {
  start: (config: {
    baseUrl: string;
    meetingId: string;
    source?: string;
    intentions?: string[];
    language?: string;
    emitTranscripts?: boolean;
    userId?: string;
    platform?: string;
  }) => Promise<{ success: boolean; error?: string; code?: string }>;
  sendChunk: (chunk: ArrayBuffer | Uint8Array) => void;
  sendMicActivity: (
    micActivity: Array<{ time: number; micState: "on" | "off" }>,
  ) => void;
  end: () => Promise<void>;
  stop: () => Promise<void>;
  onStateChange: (callback: (state: string) => void) => () => void;
  onError: (callback: (error: StreamingError) => void) => () => void;
  onComplete: (callback: (data: unknown) => void) => () => void;
  onTranscript: (callback: (data: unknown) => void) => () => void;
};

const getStreamingBridge = (): StreamingBridge | null => {
  if (typeof window === "undefined") return null;
  const electron = (
    window as typeof window & { electron?: { streaming?: StreamingBridge } }
  ).electron;
  return electron?.streaming ?? null;
};

/**
 * Electron IPC-backed streamer that proxies PCM chunks to the main process,
 * which uses the Node RealtimeStreamingClient (ws).
 */
export class ElectronAudioStreamer {
  public streamedBytes = 0;
  public streamedChunks = 0;
  private isConnected = false;
  private isStopping = false;
  private hasEnded = false;
  private hasCompleted = false;
  /** Length of the current run of failed send-loop iterations. */
  private consecutiveFailures = 0;
  private sendLoopActive = false;
  private hasReportedTerminalFailure = false;
  private currentChunk: Uint8Array | null = null;
  private cleanupListeners: Array<() => void> = [];
  private bridge: StreamingBridge | null;
  private pendingMicActivity: Array<{
    time: number;
    micState: "on" | "off";
  }> | null = null;

  constructor(
    private readonly socketUrl: string,
    private readonly meetingId: string,
    private readonly audioBuffer: AudioFileBuffer,
    private readonly callback: StreamerCallback,
    private readonly language?: string,
    private readonly userId?: string,
  ) {
    this.bridge = getStreamingBridge();
    if (!this.bridge) {
      this.reportTerminalFailure(
        "Electron streaming bridge unavailable",
        STREAM_FAILURE_CODE.disconnected,
      );
      return;
    }
    void this.start();
  }

  private async start(): Promise<void> {
    if (!this.bridge) return;
    this.callback.onStreamStatusUpdate(StreamingState.CONNECTING);

    this.cleanupListeners.push(
      this.bridge.onStateChange((state) => this.handleStateChange(state)),
    );
    this.cleanupListeners.push(
      this.bridge.onError((error) => this.handleError(error)),
    );
    this.cleanupListeners.push(
      this.bridge.onComplete(() => this.handleComplete()),
    );
    const { success, error, code } = await this.bridge.start({
      baseUrl: this.socketUrl,
      meetingId: this.meetingId,
      intentions: ["transcription"],
      source: "mobile-ff",
      platform: "electron",
      emitTranscripts: true,
      ...(this.language ? { language: this.language } : {}),
    });

    if (!success) {
      this.handleError({
        message: error || "Failed to start streaming",
        ...(code ? { code } : {}),
        terminal: true,
      });
    }
  }

  private handleStateChange(state: string) {
    if (state === "CONNECTED") {
      this.isConnected = true;
      this.callback.onStreamStatusUpdate(StreamingState.STREAMING);
      this.flushPendingMicActivity();
      // CONNECTED arrives more than once — the main process emits it from
      // both the connection-state change and stream-start, and again on every
      // reconnect. A second send loop would interleave with the first between
      // readNextChunk() and sendChunk(), putting PCM on the wire out of order.
      // The running loop already handles reconnects by polling isConnected.
      if (!this.sendLoopActive) {
        this.sendLoopActive = true;
        void this.readAndSendData();
      }
      return;
    }

    if (state === "CONNECTING" || state === "RECONNECTING") {
      this.callback.onStreamStatusUpdate(StreamingState.CONNECTING);
      return;
    }

    if (state === "DISCONNECTED" || state === "ERROR") {
      this.isConnected = false;
      // The client emits DISCONNECTED before each reconnect too, so this is
      // logged only — the user is told when the client gives up for good and
      // sends a terminal error.
      if (!this.isStopping && !this.hasReportedTerminalFailure) {
        this.callback.onStreamStatusUpdate(StreamingState.INACTIVE);
        this.callback.log(`[ElectronAudioStreamer] streaming disconnected`);
      }
    }
  }

  /**
   * Transient errors are followed by a reconnect that resolves a fresh token,
   * so only terminal ones end the stream and reach the user.
   */
  private handleError(error: StreamingError) {
    if (!error.terminal) {
      this.callback.log(
        `[ElectronAudioStreamer] streaming error: ${error.message}`,
      );
      return;
    }
    this.reportTerminalFailure(
      error.message,
      error.code === STREAMING_AUTH_FAILED
        ? STREAM_FAILURE_CODE.authFailed
        : STREAM_FAILURE_CODE.disconnected,
    );
  }

  /** Terminal failures reach the user, so only the first one is reported. */
  private reportTerminalFailure(message: string, code: string) {
    if (this.isStopping || this.hasReportedTerminalFailure) return;
    this.hasReportedTerminalFailure = true;
    // Leaves the pending-streaming UI state; the DISCONNECTED that follows a
    // terminal failure is suppressed, so nothing else would clear it.
    this.callback.onStreamStatusUpdate(StreamingState.INACTIVE);
    this.callback.onStreamFailed(message, code);
  }

  private handleComplete() {
    if (this.isStopping) return;
    this.reportCompleted();
    this.stopStreaming();
  }

  /**
   * Announce completion exactly once. The module's handler releases the
   * recording session, so a second announcement could tear down whichever
   * session is current by then — and it re-runs the upload/telemetry the app
   * hangs off this callback.
   */
  private reportCompleted(): void {
    if (this.hasCompleted) return;
    this.hasCompleted = true;
    this.callback.onStreamCompleted();
  }

  /**
   * Drive the send loop, surviving an unexpected throw.
   *
   * The loop is self-perpetuating and nothing restarts it — CONNECTED starts
   * it exactly once (see handleStateChange). So a throw escaping pumpOnce()
   * would stop streaming for the rest of the recording AND withhold
   * onStreamCompleted, leaving stop() to sit out its entire drain ceiling
   * before giving up on a stream that was never going to finish.
   */
  private async readAndSendData(): Promise<void> {
    try {
      await this.pumpOnce();
    } catch (error) {
      this.handlePumpFailure(error);
    }
  }

  /**
   * Report a failed iteration and schedule the retry.
   *
   * Only the first failure of a streak is reported: onStreamError reaches
   * Sentry and raises a toast, and a persistent fault (a dead storage handle,
   * a broken bridge) would otherwise fire one every 10 ms for the length of
   * the meeting. The retry backs off for the same reason — a hot loop around
   * a failing read helps nothing and costs a core.
   */
  private handlePumpFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.consecutiveFailures++;

    if (this.consecutiveFailures === 1) {
      this.callback.onStreamError(message);
    } else {
      this.callback.log(
        `[ElectronAudioStreamer] send loop failure #${this.consecutiveFailures}: ${message}`,
      );
    }

    if (this.isStopping) return;
    const backoff = Math.min(
      SEND_INTERVAL * 2 ** (this.consecutiveFailures - 1),
      MAX_RETRY_INTERVAL,
    );
    setTimeout(() => void this.readAndSendData(), backoff);
  }

  /** One iteration: read a chunk, send it, and schedule the next. */
  private async pumpOnce(): Promise<void> {
    if (this.isStopping) return;

    if (!this.isConnected) {
      // Waiting for a reconnect only makes sense while the recording can still
      // produce audio. Once the buffer is closed, parking here would outlive
      // the recording — and the streaming bridge is shared, so this loop would
      // wake up on the NEXT meeting's connection and send into its socket.
      if (!this.audioBuffer.writing) {
        void this.finishStreaming();
        return;
      }
      setTimeout(() => void this.readAndSendData(), SEND_INTERVAL);
      return;
    }

    let chunk: Uint8Array | undefined | null;
    if (this.currentChunk) {
      chunk = this.currentChunk;
      this.currentChunk = null;
    } else {
      chunk = await this.audioBuffer.readNextChunk();
      // The read is unbounded, so a stop can land inside it. The bridge is
      // shared process-wide: sending after that point puts this recording's
      // audio into whatever session owns the bridge next.
      if (this.isStopping) return;
    }

    if (!chunk || chunk.length === 0) {
      if (this.audioBuffer.writing) {
        setTimeout(() => void this.readAndSendData(), SEND_INTERVAL);
      } else {
        await this.finishStreaming();
      }
      return;
    }

    const payload =
      chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength
        ? chunk
        : chunk.slice();

    try {
      this.bridge?.sendChunk(payload);
      this.streamedBytes += payload.byteLength;
      this.streamedChunks += 1;
      this.consecutiveFailures = 0;

      // If buffer has a backlog (e.g., after reconnect), drain it as fast as
      // possible. Once caught up, pace at real-time to avoid flooding the backend.
      const hasBacklog =
        this.audioBuffer.fileSize - this.audioBuffer.readOffset >
        chunk.length * 2;
      const sampleRate = Math.max(1, this.audioBuffer.samplingRate);
      const sampleCount = payload.length / BYTES_PER_SAMPLE;
      const delayMs = hasBacklog
        ? 1
        : Math.max(MIN_SEND_DELAY_MS, (sampleCount / sampleRate) * 1000);
      setTimeout(() => {
        void this.readAndSendData();
      }, delayMs);
    } catch (error) {
      // Keep the chunk so the retry resends it rather than dropping audio.
      this.currentChunk = chunk;
      this.handlePumpFailure(error);
    }
  }

  /**
   * Signal end-of-stream, once. Bounded, because an unanswered IPC would
   * otherwise withhold the completion callback that tells the app the
   * recording has been handed off.
   */
  private endStream(): Promise<void> {
    if (this.hasEnded) return Promise.resolve();
    this.hasEnded = true;
    return withTimeout(
      Promise.resolve(this.bridge?.end()),
      END_STREAM_TIMEOUT_MS,
      "streaming.end",
    );
  }

  /**
   * End the stream and tear the streamer down. Never throws — it runs from the
   * send loop, and onStreamCompleted() re-enters the module to release the
   * recording, so a throw there must not be able to restart the loop.
   */
  private async finishStreaming(): Promise<void> {
    try {
      await this.endStream();
    } catch (err) {
      this.callback.onStreamError(
        err instanceof Error ? err.message : String(err),
      );
    }
    try {
      this.reportCompleted();
    } catch (err) {
      this.callback.log(
        `[ElectronAudioStreamer] completion handler failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    this.stopStreaming();
  }

  sendMicActivity(
    micActivity: Array<{ time: number; micState: "on" | "off" }>,
  ): void {
    if (micActivity.length > 0) {
      this.pendingMicActivity = micActivity;
    }
    if (!this.isConnected || !this.bridge) return;
    try {
      this.bridge.sendMicActivity(micActivity);
    } catch (error) {
      this.callback.log(
        `[ElectronAudioStreamer] Failed to send mic activity: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private flushPendingMicActivity(): void {
    if (!this.bridge || !this.pendingMicActivity) return;
    try {
      this.bridge.sendMicActivity(this.pendingMicActivity);
    } catch (error) {
      this.callback.log(
        `[ElectronAudioStreamer] Failed to flush pending mic activity: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  stopStreaming(): void {
    if (this.isStopping) return;
    this.isStopping = true;
    this.isConnected = false;
    this.cleanupListeners.forEach((dispose) => dispose());
    this.cleanupListeners = [];
    if (this.bridge) {
      // Both are fire-and-forget, but their rejections still have to be
      // consumed or teardown surfaces as an unhandled rejection.
      void this.endStream().catch(() => {});
      void this.bridge.stop().catch(() => {});
    }
    this.callback.onStreamStatusUpdate(StreamingState.INACTIVE);
  }
}

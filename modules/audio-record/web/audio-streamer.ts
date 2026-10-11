/**
 * AudioStreamer streams audio data from an AudioFileBuffer to a remote server using Socket.IO.
 *
 * It manages connection setup, reconnection strategies, reading data from the buffer,
 * and sending data chunks.
 */

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import { io } from "socket.io-client";
import type { AudioFileBuffer } from "./audio-file-buffer";
import { StreamingState } from "./constants";

// MARK: - Protocol Constants
const MEDIA_CHUNK_UPLOAD_EVENT = "media.chunk.upload.event";
const UPLOAD_NOT_ALLOWED = "upload not allowed";
const CONN_ALREADY_EXIST = "already exists";
const PARAM_ENABLE_REAL_TIME_UPLOAD = "enableRealTimeUpload";
const PARAM_SAMPLING_RATE = "samplingRate";
const PARAM_ENCODE_AUDIO = "encodeAudio";
const PARAM_FILE_EXTENSION_TYPE = "fileExtensionType";
const RECONNECTION_DELAY = 10000;
const SEND_INTERVAL = 100;
const MAX_ATTEMPTS_AFTER_RECORD_ENDS = 5;

// MARK: - Streamer Callback Interface
export interface StreamerCallback {
  onStreamStatusUpdate(state: StreamingState): void;
  log(message: string): void;
  onStreamCompleted(): void;
  /** `code` distinguishes terminal failures (see STREAM_FAILURE_CODE). */
  onStreamFailed(message: string, code?: string): void;
  onStreamError(message: string): void;
}

/**
 * AudioStreamer handles real-time streaming of audio chunks via Socket.IO.
 */
export class AudioStreamer {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private isStopping: boolean = false;
  private currentChunkData: Uint8Array | null = null;
  private connectionInitTimer: ReturnType<typeof setTimeout> | null = null;
  private afterRecordConnectAttemptCount: number = 0;

  // MARK: - Initialization & Socket Setup
  constructor(
    private readonly socketUrl: string,
    private readonly socketAuthToken: string,
    private readonly audioBuffer: AudioFileBuffer,
    private readonly callback: StreamerCallback,
    private readonly fileExtensionType: string,
  ) {
    this.setupSocketIO();
  }

  /**
   * Initializes the Socket.IO client and sets up event handlers.
   */
  private setupSocketIO(): void {
    this.callback.onStreamStatusUpdate(StreamingState.CONNECTING);
    const samplingRate = this.audioBuffer.samplingRate;
    const options: Partial<ManagerOptions & SocketOptions> = {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: 20000,
      secure: true,
      transports: ["websocket"],
      auth: { token: this.socketAuthToken },
      query: {
        [PARAM_ENABLE_REAL_TIME_UPLOAD]: "true",
        [PARAM_SAMPLING_RATE]: samplingRate.toString(),
        [PARAM_ENCODE_AUDIO]: "true",
        [PARAM_FILE_EXTENSION_TYPE]: this.fileExtensionType,
      },
    };
    this.socket = io(`${this.socketUrl}/transcription`, options);
    this.addSocketHandlers();
    this.connectSocket();
  }

  // MARK: - Connection Management
  /**
   * Connects the socket if not already connected.
   */
  private connectSocket(): void {
    if (this.isConnected) {
      this.callback.log(
        "AudioStreamer: Already connected. Skipping connect attempt.",
      );
      return;
    }
    this.callback.log("AudioStreamer: Connecting to Socket.IO...");
    this.socket?.connect();
  }

  /**
   * Attempts to reconnect the socket.
   */
  private reconnectSocket(): void {
    if (this.isStopping) return;
    this.callback.log("AudioStreamer: Reconnecting to Socket.IO...");
    if (!this.audioBuffer.writing) {
      this.afterRecordConnectAttemptCount += 1;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  private setupConnectionInitTimer(): void {
    this.cancelConnectionInitTimer();
    this.connectionInitTimer = setTimeout(() => {
      this.callback.log(
        "AudioStreamer: Safety timer triggered - totalBytesStored not received. Forcing reconnection...",
      );
      this.reconnectSocket();
    }, RECONNECTION_DELAY * 2);
  }

  private cancelConnectionInitTimer(): void {
    if (this.connectionInitTimer) {
      clearTimeout(this.connectionInitTimer);
      this.connectionInitTimer = null;
    }
  }

  private addSocketHandlers(): void {
    if (!this.socket) return;
    this.socket.on("connect", this.onConnect.bind(this));
    this.socket.on("disconnect", this.onDisconnect.bind(this));
    this.socket.on("connect_error", this.onError.bind(this));
    this.socket.on("totalBytesStored", this.onTotalBytesStored.bind(this));
    this.socket.on("reconnect_attempt", (attempt) => {
      this.callback.log(
        `AudioStreamer: Socket.IO reconnect attempt ${attempt}`,
      );
      this.callback.onStreamStatusUpdate(StreamingState.CONNECTING);
      if (!this.audioBuffer.writing) {
        this.afterRecordConnectAttemptCount += 1;
      }
    });
  }

  private onConnect(): void {
    this.callback.log("AudioStreamer: Socket.IO connected");
    this.setupConnectionInitTimer();
  }

  private onDisconnect(): void {
    this.callback.log("AudioStreamer: Socket.IO disconnected");
    this.isConnected = false;
    if (
      this.afterRecordConnectAttemptCount > MAX_ATTEMPTS_AFTER_RECORD_ENDS &&
      !this.audioBuffer.writing
    ) {
      this.callback.log(
        `AudioStreamer: Stream failed after ${MAX_ATTEMPTS_AFTER_RECORD_ENDS} attempts.`,
      );
      this.callback.onStreamFailed(
        `Stream failed after ${MAX_ATTEMPTS_AFTER_RECORD_ENDS} attempts.`,
      );
      this.stopStreaming();
    }
  }

  private onError(error: unknown): void {
    let errorMessage = "";
    if (typeof error === "string") {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message || "Unknown error";
    } else {
      errorMessage = JSON.stringify(error);
    }
    this.callback.log(`AudioStreamer: Socket.IO error: ${errorMessage}`);
    this.callback.onStreamError(errorMessage);
    if (errorMessage.includes(UPLOAD_NOT_ALLOWED)) {
      this.stopStreaming();
      this.callback.onStreamCompleted();
      return;
    }
    if (errorMessage.includes(CONN_ALREADY_EXIST)) {
      setTimeout(() => {
        if (!this.isConnected && this.socket) {
          this.socket.connect();
        }
      }, RECONNECTION_DELAY);
    } else {
      this.callback.onStreamStatusUpdate(StreamingState.CONNECTING);
      if (
        this.afterRecordConnectAttemptCount > MAX_ATTEMPTS_AFTER_RECORD_ENDS
      ) {
        this.callback.log(
          `AudioStreamer: Stream failed after ${MAX_ATTEMPTS_AFTER_RECORD_ENDS} attempts.`,
        );
        this.callback.onStreamFailed(
          `Stream failed after ${MAX_ATTEMPTS_AFTER_RECORD_ENDS} attempts.`,
        );
        this.stopStreaming();
      } else {
        this.reconnectSocket();
      }
    }
  }

  private onTotalBytesStored(args?: { totalBytesStored: number }): void {
    this.callback.log("AudioStreamer: Socket.IO onTotalBytesStored");
    const bytesStored = args?.totalBytesStored;
    if (typeof bytesStored === "number") {
      try {
        this.callback.log(
          `AudioStreamer: local readOffset: ${this.audioBuffer.readOffset}`,
        );
        this.callback.log(`AudioStreamer: server readOffset: ${bytesStored}`);
        this.callback.log(
          `AudioStreamer: local fileSize: ${this.audioBuffer.fileSize}`,
        );
        this.callback.log(
          `AudioStreamer: isWriting: ${this.audioBuffer.writing}`,
        );

        this.audioBuffer.rewindReadOffset(bytesStored);
        this.currentChunkData = null;
        this.cancelConnectionInitTimer();
        this.isConnected = true;
        this.startStreaming();
      } catch (e: unknown) {
        let errorMessage = "";
        if (typeof e === "string") {
          errorMessage = e;
        } else if (e instanceof Error) {
          errorMessage = e.message || "Unknown error";
        } else {
          errorMessage = JSON.stringify(e);
        }
        this.callback.onStreamFailed(
          errorMessage ?? "Streaming failed due to an unknown error.",
        );
        this.stopStreaming();
      }
    } else {
      this.callback.log(
        "AudioStreamer: invalid data received from onTotalBytesStored",
      );
      this.reconnectSocket();
    }
  }

  // MARK: - Data Streaming Methods
  /**
   * Starts streaming by reading and sending data chunks.
   */
  private startStreaming(): void {
    if (!this.isConnected) {
      this.callback.log(
        "AudioStreamer: Cannot start streaming. Socket.IO is not connected.",
      );
      return;
    }

    // Check if we have any data available before starting
    if (this.audioBuffer.fileSize === 0 && this.audioBuffer.writing) {
      this.callback.onStreamStatusUpdate(StreamingState.STREAMING);
      // Start the read loop but it will wait for data
      this.readAndSendData();
      return;
    }

    this.callback.log("AudioStreamer: Starting streaming...");
    this.callback.onStreamStatusUpdate(StreamingState.STREAMING);
    this.readAndSendData();
  }

  /**
   * Reads the next chunk from the buffer and sends it.
   */
  private async readAndSendData(): Promise<void> {
    if (!this.isConnected) return;

    let chunk: Uint8Array | undefined;
    if (this.currentChunkData) {
      chunk = this.currentChunkData;
      this.currentChunkData = null;
    } else {
      chunk = (await this.audioBuffer.readNextChunk()) || undefined;
    }

    if (!chunk || chunk.length === 0) {
      if (this.audioBuffer.writing) {
        // No data available yet, wait and retry
        setTimeout(() => this.readAndSendData(), SEND_INTERVAL);
      } else {
        // Recording ended and no more data - complete streaming
        this.callback.onStreamCompleted();
        this.stopStreaming();
      }
      return;
    }

    const onFailAck = () => {
      this.currentChunkData = chunk;
      setTimeout(() => this.readAndSendData(), SEND_INTERVAL);
    };

    this.socket
      ?.emitWithAck(
        MEDIA_CHUNK_UPLOAD_EVENT,
        JSON.stringify({ data: Array.from(chunk) }),
      )
      .then(
        (value) => {
          if (value && (typeof value !== "object" || value.success)) {
            this.readAndSendData();
          } else {
            onFailAck();
          }
        },
        (error) => {
          this.callback.log(`AudioStreamer: Emit error: ${error}`);
          onFailAck();
        },
      );
  }

  // MARK: - Closing Methods
  /**
   * Stops streaming and disconnects the socket.
   */
  stopStreaming(): void {
    if (this.isStopping) return;
    this.isStopping = true;
    this.cancelConnectionInitTimer();
    this.callback.log("AudioStreamer: stream end");
    this.callback.onStreamStatusUpdate(StreamingState.INACTIVE);
    this.closeSocket();
  }

  /**
   * Closes the Socket.IO connection and cleans up listeners.
   */
  private closeSocket(): void {
    this.isConnected = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.callback.log("AudioStreamer: Socket.IO connection closed");
  }
}

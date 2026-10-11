import { Logger } from "@/logger";
import { WebRecordingStorage } from "./web-recording-storage";

const log = new Logger("AudioRecord");

export interface AudioWriteData {
  // The encoded data to write.
  data: Uint8Array;
  // Optional position in the buffer; if omitted, data is appended.
  position?: number;
}

/**
 * Child classes must override:
 *  - encode(pcmData) to convert PCM data into an AudioWriteData,
 *  - flush() to finalize and return any remaining AudioWriteData.
 */
export abstract class AudioFileBuffer {
  samplingRate: number;
  writing = true;
  readOffset = 0;
  fileSize = 0;
  readChunkSize: number;

  // recording properties
  private fileUri?: string;
  private mimeType: string;
  private chunkIndex = 0;

  // Streaming enablement
  private streamingEnabled: boolean;

  // In-memory streaming buffer (150MB cap) - only allocated if streaming enabled
  private streamBuffer: Uint8Array[] = [];
  private streamBufferBytes = 0; // total bytes currently in buffer
  private streamPurgedBytesTotal = 0; // absolute bytes purged from the front since start
  private readonly streamByteLimit = 150 * 1024 * 1024; // 150MB
  private streamCursorAbs = 0; // absolute read cursor (>= streamPurgedBytesTotal)
  private streamChunkOffsets: number[] = []; // prefix-sum offsets within current buffer
  private streamChunkTimestamps: number[] = []; // timestamps for each chunk

  // Write queue to prevent race conditions
  private writeQueue: Promise<void> = Promise.resolve();
  private isEnding = false;
  private isInitialized = false;

  // Health monitoring
  private lastWriteTime = Date.now();
  private writeTimeoutMs = 30000; // 30 seconds without writes triggers warning
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;

  // Cleanup management
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private readonly maxChunkAge = 5 * 60 * 1000; // 5 minutes

  // Error recovery
  private consecutiveWriteErrors = 0;
  private readonly maxConsecutiveErrors = 5;

  // Performance metrics
  private totalBytesWritten = 0;
  private totalChunksWritten = 0;
  private startTime = Date.now();

  constructor({
    samplingRate,
    readChunkSize,
    mimeType,
    fileUri,
    streamingEnabled = false,
  }: {
    samplingRate: number;
    readChunkSize: number;
    mimeType: string;
    fileUri?: string;
    streamingEnabled?: boolean;
  }) {
    this.samplingRate = samplingRate;
    this.readChunkSize = readChunkSize;
    this.fileUri = fileUri;
    this.mimeType = mimeType;
    this.streamingEnabled = streamingEnabled;

    // Start health monitoring
    this.startHealthMonitoring();

    // Only start cleanup timer if streaming is enabled
    if (this.streamingEnabled) {
      this.startCleanupTimer();
    }
  }

  /**
   * Initialize the recording in storage. This should be called after construction
   * to ensure proper async initialization without race conditions.
   */
  async initializeRecording(): Promise<void> {
    if (this.isInitialized) {
      log.warn("Recording already initialized");
      return;
    }

    if (!this.fileUri || !this.mimeType) {
      throw new Error("fileUri and mimeType are required for initialization");
    }

    try {
      await WebRecordingStorage.initializeRecording(
        this.fileUri,
        this.mimeType,
      );
      this.isInitialized = true;
      this.startTime = Date.now();
      log.info("Recording initialized", { fileUri: this.fileUri });
    } catch (error) {
      log.error("Failed to initialize recording", { error });
      throw error;
    }
  }

  // MARK: - Health Monitoring
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      const timeSinceLastWrite = Date.now() - this.lastWriteTime;

      if (
        this.writing &&
        !this.isEnding &&
        timeSinceLastWrite > this.writeTimeoutMs
      ) {
        log.warn(`No audio data written for ${timeSinceLastWrite}ms`, {
          fileUri: this.fileUri,
          totalChunks: this.totalChunksWritten,
          totalBytes: this.totalBytesWritten,
        });
      }

      // Check memory usage - only if streaming is enabled
      if (
        this.streamingEnabled &&
        this.streamBufferBytes > this.streamByteLimit * 0.9
      ) {
        log.warn("Stream buffer near capacity", {
          used: this.streamBufferBytes,
          limit: this.streamByteLimit,
        });
        this.enforceBufferLimit(true); // Force aggressive cleanup
      }
    }, 5000);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.enforceBufferLimit(false);
    }, 10000);
  }

  private enforceBufferLimit(aggressive: boolean = false): void {
    const now = Date.now();
    const maxAge = aggressive ? 60 * 1000 : this.maxChunkAge; // 1 minute if aggressive

    while (
      this.streamBuffer.length > 0 &&
      this.streamChunkTimestamps.length > 0
    ) {
      const firstChunkAge = now - this.streamChunkTimestamps[0];

      if (
        firstChunkAge > maxAge ||
        (aggressive && this.streamBufferBytes > this.streamByteLimit * 0.5)
      ) {
        this.purgeOldestChunk();
      } else {
        break;
      }
    }
  }

  private purgeOldestChunk(): void {
    const first = this.streamBuffer.shift();
    if (!first) return;

    this.streamBufferBytes -= first.length;
    this.streamPurgedBytesTotal += first.length;
    this.streamChunkTimestamps.shift();

    // Update offsets
    if (this.streamChunkOffsets.length > 0) {
      const removed = this.streamChunkOffsets.shift();
      const delta = removed ?? 0;
      for (let i = 0; i < this.streamChunkOffsets.length; i++) {
        this.streamChunkOffsets[i] -= delta;
      }
    }

    // Adjust cursor if needed
    if (this.streamCursorAbs < this.streamPurgedBytesTotal) {
      this.streamCursorAbs = this.streamPurgedBytesTotal;
    }
  }

  // MARK: - readNextChunk
  async readNextChunk(): Promise<Uint8Array | null> {
    // Only allow reading if streaming is enabled
    if (!this.streamingEnabled) {
      log.debug(
        "readNextChunk called but streaming is not enabled for this buffer",
      );
      return null;
    }

    // Calculate available bytes in buffer from cursor
    const bufferStartAbs = this.streamPurgedBytesTotal;
    const bufferEndAbs = this.streamPurgedBytesTotal + this.streamBufferBytes;

    if (this.streamCursorAbs < bufferStartAbs) {
      // Cursor fell behind purged window: clamp to earliest available
      this.streamCursorAbs = bufferStartAbs;
    }

    if (this.streamCursorAbs >= bufferEndAbs) {
      // No new data yet
      return null;
    }

    const maxReadable = bufferEndAbs - this.streamCursorAbs;
    const toRead = Math.min(this.readChunkSize, maxReadable);
    const chunk = this.copyFromStreamBuffer(this.streamCursorAbs, toRead);
    this.streamCursorAbs += chunk.length;
    // Also advance legacy readOffset to reflect progress for logs/metrics
    this.readOffset = this.streamCursorAbs;
    return chunk.length > 0 ? chunk : null;
  }

  // MARK: - Utility: Convert Float32 PCM to PCM16 bytes
  /**
   * Convert Float32Array PCM samples (-1.0 to 1.0) to 16-bit signed PCM bytes.
   * This is used for streaming raw PCM data to the backend.
   */
  static convertPCMToBytes(pcmData: Float32Array): Uint8Array {
    const pcm16 = new Int16Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      // Clamp to [-1.0, 1.0] and convert to 16-bit signed integer
      const sample = Math.max(-1, Math.min(1, pcmData[i]));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return new Uint8Array(pcm16.buffer);
  }

  // MARK: - writePCMChunk (for raw PCM streaming)
  /**
   * Write raw PCM data (Float32Array) to the streaming buffer.
   * This converts PCM to 16-bit bytes and enqueues for streaming.
   * Does NOT write to file - only for streaming.
   */
  async writePCMChunk(pcmData: Float32Array): Promise<void> {
    if (!this.writing || this.isEnding) {
      return;
    }

    if (!this.streamingEnabled) {
      // Skip if streaming not enabled
      return;
    }

    const op = this.writeQueue.then(async () => {
      if (!this.writing || this.isEnding) {
        return;
      }
      try {
        // Convert Float32Array to PCM16 bytes
        const pcmBytes = AudioFileBuffer.convertPCMToBytes(pcmData);

        // Only enqueue to stream buffer (don't write to file)
        this.enqueueStreamData(pcmBytes);

        this.lastWriteTime = Date.now();
        this.consecutiveWriteErrors = 0;
        this.totalBytesWritten += pcmBytes.length;
        this.totalChunksWritten++;

        // Update fileSize to reflect streamed data
        this.fileSize += pcmBytes.length;
      } catch (error) {
        this.consecutiveWriteErrors++;
        if (this.consecutiveWriteErrors >= this.maxConsecutiveErrors) {
          log.error(
            `Max consecutive write errors (${this.maxConsecutiveErrors}) reached, stopping recording`,
            { error },
          );
          this.isEnding = true;
          throw new Error("Recording failed due to repeated write errors");
        }
        log.error("PCM write error", { error });
        throw error;
      }
    });
    this.writeQueue = op.catch(() => {});
    await op;
  }

  // MARK: - writeEncodedChunk (for pre-encoded media like MediaRecorder)
  async writeEncodedChunk(data: Uint8Array): Promise<void> {
    if (!this.writing || this.isEnding) {
      return;
    }

    const op = this.writeQueue.then(async () => {
      if (!this.writing || this.isEnding) {
        return;
      }
      try {
        await this.saveChunkWithRetry(data);
        this.lastWriteTime = Date.now();
        this.consecutiveWriteErrors = 0;
        this.totalBytesWritten += data.length;
        this.totalChunksWritten++;

        // Only enqueue to stream buffer if streaming is enabled
        if (this.streamingEnabled) {
          this.enqueueStreamData(data);
        }
      } catch (error) {
        this.consecutiveWriteErrors++;
        if (this.consecutiveWriteErrors >= this.maxConsecutiveErrors) {
          log.error(
            `Max consecutive write errors (${this.maxConsecutiveErrors}) reached, stopping recording`,
            { error },
          );
          this.isEnding = true;
          throw new Error("Recording failed due to repeated write errors");
        }
        log.error(
          `Write error (${this.consecutiveWriteErrors}/${this.maxConsecutiveErrors})`,
          { error },
        );
        throw error;
      }
    });
    this.writeQueue = op.catch(() => {});
    await op;
  }

  private async saveChunkWithRetry(data: Uint8Array): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        if (this.fileUri) {
          await WebRecordingStorage.saveRecordingChunk(
            this.fileUri,
            this.chunkIndex,
            data,
          );

          // Success - increment chunk index and file size
          this.chunkIndex++;
          this.fileSize += data.length;
          return;
        } else {
          // No fileUri - just track size
          this.fileSize += data.length;
          return;
        }
      } catch (error) {
        retryCount++;
        lastError = error as Error;

        log.debug(
          `Failed to save chunk (attempt ${retryCount}/${maxRetries})`,
          { error },
        );

        if (retryCount < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, retryCount) * 100;
          const jitter = Math.random() * 100;
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay + jitter),
          );
        }
      }
    }

    // All retries failed
    log.error(
      "Failed to save chunk after all retries, incrementing index to maintain order",
      { error: lastError },
    );

    // Increment index to maintain chunk order even on failure
    this.chunkIndex++;

    // Throw the last error
    throw lastError || new Error("Failed to save chunk");
  }

  async endWrite(): Promise<void> {
    if (!this.writing) {
      throw new Error("Writing has already ended.");
    }

    if (this.isEnding) {
      throw new Error("Writing is already ending.");
    }

    this.isEnding = true;

    // Wait for all pending writes to complete
    await this.writeQueue;

    try {
      const flushedData = this.flush();
      if (flushedData) {
        // Save flushed data directly to storage
        if (this.fileUri) {
          await WebRecordingStorage.saveRecordingChunk(
            this.fileUri,
            this.chunkIndex++,
            flushedData.data,
          );
          this.fileSize += flushedData.data.length;
        } else {
          this.fileSize += flushedData.data.length;
        }

        // Only append to stream buffer if streaming is enabled
        if (this.streamingEnabled) {
          this.enqueueStreamData(flushedData.data);
        }
      }
    } catch (error) {
      log.error("Failed to save final flushed chunk", { error });
      throw error;
    } finally {
      this.writing = false;

      // Finalize recording
      if (this.fileUri) {
        await this.finalizeRecording();
      }

      // Cleanup timers
      this.cleanup();
    }
  }

  private async finalizeRecording(): Promise<void> {
    if (!this.fileUri) return;

    try {
      await WebRecordingStorage.finalizeRecording(
        this.fileUri,
        this.chunkIndex,
        this.fileSize,
      );

      const duration = (Date.now() - this.startTime) / 1000;
      const avgBitrate = (this.totalBytesWritten * 8) / duration;

      log.info("Recording finalized", {
        fileUri: this.fileUri,
        totalChunks: this.totalChunksWritten,
        totalBytes: this.totalBytesWritten,
        duration: `${duration.toFixed(1)}s`,
        avgBitrate: `${(avgBitrate / 1000).toFixed(1)} kbps`,
      });
    } catch (error) {
      log.error("Failed to finalize recording", { error });
      throw error;
    }
  }

  rewindReadOffset(backendOffset: number): void {
    if (!this.streamingEnabled) {
      log.debug(
        "rewindReadOffset called but streaming is not enabled for this buffer",
      );
      return;
    }

    // Map backend absolute offset into our sliding buffer window
    const targetAbs = backendOffset + this.headerSize();
    const bufferStartAbs = this.streamPurgedBytesTotal;
    const bufferEndAbs = this.streamPurgedBytesTotal + this.streamBufferBytes;
    // Clamp into available window
    const clamped = Math.max(bufferStartAbs, Math.min(targetAbs, bufferEndAbs));
    this.streamCursorAbs = clamped;
    this.readOffset = this.streamCursorAbs;
  }

  // MARK: - Cleanup
  cleanup(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // MARK: - Getter Methods
  getFileUri(): string | undefined {
    return this.fileUri;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  setSamplingRate(rate: number): void {
    this.samplingRate = rate;
  }

  isHealthy(): boolean {
    const timeSinceLastWrite = Date.now() - this.lastWriteTime;
    return (
      this.writing &&
      !this.isEnding &&
      timeSinceLastWrite < this.writeTimeoutMs &&
      this.consecutiveWriteErrors < this.maxConsecutiveErrors
    );
  }

  getStats(): {
    totalBytes: number;
    totalChunks: number;
    bufferSize: number;
    duration: number;
    avgBitrate: number;
    healthy: boolean;
  } {
    const duration = (Date.now() - this.startTime) / 1000;
    const avgBitrate =
      duration > 0 ? (this.totalBytesWritten * 8) / duration : 0;

    return {
      totalBytes: this.totalBytesWritten,
      totalChunks: this.totalChunksWritten,
      bufferSize: this.streamBufferBytes,
      duration,
      avgBitrate,
      healthy: this.isHealthy(),
    };
  }

  // MARK: - Abstract Methods
  abstract getBufferType(): string;
  abstract headerSize(): number;
  abstract flush(): AudioWriteData | null;

  // MARK: - Internal helpers
  private enqueueStreamData(chunk: Uint8Array) {
    this.streamBuffer.push(chunk);
    this.streamBufferBytes += chunk.length;
    this.streamChunkTimestamps.push(Date.now());

    // Update prefix-sum index
    const lastOffset =
      this.streamChunkOffsets.length > 0
        ? this.streamChunkOffsets[this.streamChunkOffsets.length - 1]
        : 0;
    this.streamChunkOffsets.push(lastOffset + chunk.length);

    // Initialize cursor to the start of buffer on first write
    if (this.streamCursorAbs === 0 && this.streamPurgedBytesTotal === 0) {
      this.streamCursorAbs = 0;
    }

    // Enforce 100MB cap by purging from the front
    while (
      this.streamBufferBytes > this.streamByteLimit &&
      this.streamBuffer.length > 0
    ) {
      this.purgeOldestChunk();
    }
  }

  private copyFromStreamBuffer(absStart: number, length: number): Uint8Array {
    const result = new Uint8Array(length);
    let writeOffset = 0;
    let remaining = length;
    const relStart = absStart - this.streamPurgedBytesTotal; // position within current buffer

    // Use prefix-sum index to find starting chunk via binary search
    let idx = 0;
    let offsetInChunk = 0;

    // Validate and rebuild index if needed
    if (this.streamChunkOffsets.length !== this.streamBuffer.length) {
      this.rebuildOffsetIndex();
    }

    if (this.streamChunkOffsets.length > 0) {
      // Binary search for the starting chunk
      idx = this.findChunkIndex(relStart);
      const prevCum = idx === 0 ? 0 : this.streamChunkOffsets[idx - 1];
      offsetInChunk = Math.max(0, relStart - prevCum);
    }

    // Copy across chunks
    while (remaining > 0 && idx < this.streamBuffer.length) {
      const chunk = this.streamBuffer[idx];
      const available = chunk.length - offsetInChunk;
      const take = Math.min(available, remaining);

      if (take > 0) {
        result.set(
          chunk.subarray(offsetInChunk, offsetInChunk + take),
          writeOffset,
        );
        writeOffset += take;
        remaining -= take;
      }

      idx += 1;
      offsetInChunk = 0;
    }

    return writeOffset === length ? result : result.subarray(0, writeOffset);
  }

  private findChunkIndex(relativePosition: number): number {
    let lo = 0;
    let hi = this.streamChunkOffsets.length - 1;
    let found = this.streamChunkOffsets.length;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (this.streamChunkOffsets[mid] > relativePosition) {
        found = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    return Math.min(found, this.streamBuffer.length);
  }

  private rebuildOffsetIndex(): void {
    this.streamChunkOffsets = [];
    let acc = 0;

    for (const chunk of this.streamBuffer) {
      acc += chunk.length;
      this.streamChunkOffsets.push(acc);
    }
  }
}

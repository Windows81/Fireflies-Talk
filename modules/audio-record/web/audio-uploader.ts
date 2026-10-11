/**
 * AudioUploader performs a one-shot HTTP PUT upload after recording finishes.
 * It retries the upload until it succeeds (up to a maximum number of attempts).
 *
 * The uploader reads the audio data from an AudioFileBuffer and sends it using XMLHttpRequest.
 * It tracks progress and updates the streaming status via provided callbacks.
 */

import type { AudioFileBuffer } from "./audio-file-buffer";
import type { StreamerCallback } from "./audio-streamer";
import { Logger } from "@/logger";
import { StreamingState } from "./constants";
import { inspectUploadBlob } from "./upload-blob-inspector";
import { WebRecordingStorage } from "./web-recording-storage";

const MAX_UPLOAD_ATTEMPTS = 5;

// MARK: - AudioUploader Class
export class AudioUploader {
  private isUploading = false;
  private attemptCount = 0;
  private uploadUrl = "";

  // MARK: - Initialization
  constructor(
    private audioBuffer: AudioFileBuffer,
    private callback: StreamerCallback,
  ) {}

  // MARK: - Public API
  /**
   * Starts the upload process. Call this after recording is finished.
   */
  startUpload(uploadUrl: string) {
    if (this.isUploading) {
      this.callback.log("AudioUploader: Already uploading. Skipping start.");
      return;
    }
    this.uploadUrl = uploadUrl;
    this.isUploading = true;
    this.attemptCount = 0;
    this.callback.log("AudioUploader: Starting upload.");
    this.attemptUpload();
  }

  // MARK: - Upload Logic
  /**
   * Attempts to upload the audio data using XMLHttpRequest.
   * If the upload fails, a retry is scheduled.
   */
  private async attemptUpload() {
    this.attemptCount += 1;
    if (this.attemptCount > MAX_UPLOAD_ATTEMPTS) {
      this.callback.log(
        `AudioUploader: Upload failed after ${MAX_UPLOAD_ATTEMPTS} attempts.`,
      );
      this.callback.onStreamStatusUpdate(StreamingState.INACTIVE);
      this.callback.onStreamFailed("Upload failed after multiple attempts.");
      return;
    }

    this.callback.log(
      `AudioUploader: Attempting upload #${this.attemptCount}.`,
    );
    this.callback.onStreamStatusUpdate(StreamingState.CONNECTING);

    try {
      // If a recording exists (fileUri set), create a Blob from storage.
      const fileUri = this.audioBuffer.getFileUri();

      if (!fileUri) {
        throw new Error("No file URI available for upload");
      }

      const blobUrl = await WebRecordingStorage.createBlobUrl(fileUri);
      if (!blobUrl) throw new Error("Failed to create blob URL for upload.");
      const resp = await fetch(blobUrl);
      const uploadData = new Uint8Array(await resp.arrayBuffer());

      if (this.attemptCount === 1) {
        await this.logUploadIntegrity(fileUri, uploadData);
      }

      // Revoke URL after use
      await WebRecordingStorage.revokeBlobUrl(blobUrl);

      // Reset read offset to track upload progress from 0
      this.audioBuffer.readOffset = 0;

      const xhr = new XMLHttpRequest();

      // MARK: - Progress Tracking
      xhr.upload.addEventListener("progress", (event) => {
        if (event.loaded && event.loaded > 0) {
          // Update the audio buffer's read offset to track upload progress
          this.audioBuffer.readOffset = event.loaded;

          // Emit status update with current progress
          this.callback.onStreamStatusUpdate(StreamingState.STREAMING);

          // Log progress for debugging
          const totalBytes = uploadData.length;
          const progressPercent = Math.round((event.loaded / totalBytes) * 100);
          this.callback.log(
            `AudioUploader: Upload progress ${progressPercent}% (${event.loaded}/${totalBytes} bytes)`,
          );
        }
      });

      // MARK: - Response Handling
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          this.callback.log("AudioUploader: Upload completed.");
          this.callback.onStreamStatusUpdate(StreamingState.INACTIVE);
          this.callback.onStreamCompleted();
        } else if (xhr.status >= 500 && xhr.status < 600) {
          // Only retry on server errors (5xx)
          this.scheduleRetry(`Upload failed with status ${xhr.status}.`);
        } else {
          this.callback.onStreamFailed(
            `Upload failed with status ${xhr.status}.`,
          );
          this.callback.onStreamStatusUpdate(StreamingState.INACTIVE);
        }
      });

      xhr.addEventListener("error", () => {
        this.scheduleRetry("Network error during upload.");
      });

      xhr.open("PUT", this.uploadUrl, true);
      xhr.setRequestHeader("Content-Type", this.audioBuffer.getMimeType());
      xhr.send(uploadData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during upload";
      this.scheduleRetry(errorMessage);
    }
  }

  private scheduleRetry(err: string) {
    this.callback.onStreamError(`Upload error: ${err}`);
    this.callback.onStreamStatusUpdate(StreamingState.CONNECTING);
    const baseDelay = 5;
    const calculatedDelay = baseDelay * Math.pow(1.5, this.attemptCount);
    const retryDelay = Math.min(calculatedDelay, 30); // Cap delay at 30 seconds
    this.callback.log(`AudioUploader: error: ${err}`);
    this.callback.log(
      `AudioUploader: Scheduling retry in ${retryDelay} seconds.`,
    );
    setTimeout(() => {
      this.attemptUpload();
    }, retryDelay * 1000);
  }

  private async logUploadIntegrity(
    fileUri: string,
    uploadData: Uint8Array,
  ): Promise<void> {
    try {
      const integrity =
        await WebRecordingStorage.verifyRecordingIntegrity(fileUri);
      const mimeType = this.audioBuffer.getMimeType();
      const inspection = inspectUploadBlob(uploadData, mimeType);
      const payload = {
        uri: fileUri,
        mimeType,
        size: inspection.size,
        ebmlHeaderOffset: inspection.ebmlHeaderOffset,
        firstClusterOffset: inspection.firstClusterOffset,
        headerState: inspection.headerState,
        totalChunks: integrity.totalChunks,
        isComplete: integrity.isComplete,
        missingChunkCount: integrity.missingChunks.length,
        missingChunks: integrity.missingChunks.slice(0, 20),
        outOfOrderChunkCount: integrity.outOfOrderChunks.length,
        outOfOrderChunks: integrity.outOfOrderChunks.slice(0, 20),
      };
      const healthLogger = new Logger("RecordingHealth");
      const healthy =
        integrity.isComplete &&
        (inspection.headerState === "ok" ||
          inspection.headerState === "not-webm");
      if (healthy) {
        healthLogger.info("Recording upload integrity", payload);
      } else {
        healthLogger.warn("Recording upload integrity", payload);
      }
      this.callback.log(
        `AudioUploader: blob integrity ${inspection.headerState}, ${inspection.size} bytes, ${integrity.totalChunks} chunks, ${integrity.missingChunks.length} missing`,
      );
    } catch {
      // Telemetry must never affect the upload.
    }
  }
}

import { AudioFileBuffer } from "./audio-file-buffer";

/**
 * PCM buffer for streaming raw 16-bit PCM audio data at 24kHz.
 * This buffer is used for backend streaming and does not write to a file.
 * Audio is resampled to 24kHz before being written to this buffer.
 */
export class PCMFileBuffer extends AudioFileBuffer {
  constructor({
    readChunkSize,
    streamingEnabled = true, // Always enabled for PCM streaming
  }: {
    readChunkSize: number;
    streamingEnabled?: boolean;
  }) {
    // No fileUri - PCM buffer is for streaming only
    // Fixed 24kHz sample rate for backend compatibility
    super({
      samplingRate: 24000,
      readChunkSize,
      fileUri: undefined,
      mimeType: "audio/pcm",
      streamingEnabled,
    });
  }

  // PCM has no header
  headerSize(): number {
    return 0;
  }

  // Nothing to flush for PCM
  flush() {
    return null;
  }

  getBufferType(): string {
    return "raw";
  }
}

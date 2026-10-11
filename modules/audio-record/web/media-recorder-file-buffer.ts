import { AudioFileBuffer } from "./audio-file-buffer";

export class MediaRecorderFileBuffer extends AudioFileBuffer {
  private extension: string;

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
    super({ samplingRate, readChunkSize, fileUri, mimeType, streamingEnabled });
    const base = (mimeType || "").split(";")[0].toLowerCase();
    // Map to server-expected fileExtensionType
    if (base === "audio/mp4") this.extension = "m4a";
    else if (base === "audio/webm" || base === "video/webm")
      this.extension = "webm";
    else if (base === "audio/ogg") this.extension = "ogg";
    else if (base === "audio/mpeg") this.extension = "mp3";
    else this.extension = "webm";
  }

  // Compressed formats don't have a fixed header we need to offset
  headerSize(): number {
    return 0;
  }

  flush() {
    return null;
  }

  getBufferType(): string {
    return this.extension;
  }
}

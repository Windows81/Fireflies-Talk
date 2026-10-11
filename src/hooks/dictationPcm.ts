import { createPcmChunker } from "./dictationPcmChunker";
import { takeDictationPcmContext } from "./dictationPcmContext";
import { DICTATION_PCM_WORKLET_NAME } from "./dictationPcmWorklet";

export const DICTATION_PCM_SAMPLE_RATE = 16_000;
// PCM reaches the transcriber in 50ms chunks (800 samples @ 16kHz). The
// ScriptProcessor fallback still requires a power-of-2 buffer, so it stays
// at 2048 and feeds the same chunker.
export const DICTATION_PCM_CHUNK_SAMPLES = 800;
export const DICTATION_PCM_SCRIPT_BUFFER_SIZE = 2048;
export const MAX_DICTATION_AUDIO_SECONDS = 120;
export const MIN_DICTATION_AUDIO_SECONDS = 0.1;
export const MAX_DICTATION_PCM_SAMPLES =
  MAX_DICTATION_AUDIO_SECONDS * DICTATION_PCM_SAMPLE_RATE;
export const MIN_DICTATION_PCM_SAMPLES = Math.ceil(
  MIN_DICTATION_AUDIO_SECONDS * DICTATION_PCM_SAMPLE_RATE,
);

export function floatToPcm16(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return clamped < 0 ? clamped * 32768 : clamped * 32767;
}

export function startDictationPcmCapture(
  stream: MediaStream,
  onChunk: (pcm: Int16Array) => void,
): { close: () => void } {
  const { audioContext, workletReady } = takeDictationPcmContext();
  // Talk's hotkey is not a renderer gesture, so Chromium may start this
  // context suspended and drop speech until resume.
  if (audioContext.state === "suspended") {
    void audioContext.resume().then(
      () => undefined,
      () => undefined,
    );
  }
  const source = audioContext.createMediaStreamSource(stream);
  let closed = false;
  const chunker = createPcmChunker(DICTATION_PCM_CHUNK_SAMPLES, onChunk);
  let workletNode: AudioWorkletNode | null = null;
  let scriptProcessor: ScriptProcessorNode | null = null;

  const startScriptProcessorFallback = () => {
    if (closed) return;
    const processor = audioContext.createScriptProcessor(
      DICTATION_PCM_SCRIPT_BUFFER_SIZE,
      1,
      1,
    );
    scriptProcessor = processor;
    processor.onaudioprocess = (event) => {
      if (closed) return;
      const channelData = event.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        pcmData[i] = floatToPcm16(channelData[i]);
      }
      chunker.push(pcmData);
    };
    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  if (workletReady) {
    const node = new AudioWorkletNode(
      audioContext,
      DICTATION_PCM_WORKLET_NAME,
      {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      },
    );
    workletNode = node;
    node.port.onmessage = (event) => {
      if (closed) return;
      chunker.push(event.data as Int16Array);
    };
    // numberOfOutputs is 0, so no destination connection is needed.
    source.connect(node);
  } else {
    startScriptProcessorFallback();
  }

  return {
    close: () => {
      if (closed) return;
      closed = true;
      if (scriptProcessor) {
        scriptProcessor.onaudioprocess = null;
        scriptProcessor.disconnect();
      }
      if (workletNode) {
        workletNode.port.onmessage = null;
        workletNode.disconnect();
      }
      source.disconnect();
      // Emit the buffered tail before the context goes away.
      chunker.flush();
      // Close now. Waiting on resume would leak the context if resume hangs.
      void audioContext.close().then(
        () => undefined,
        () => undefined,
      );
    },
  };
}

export function concatInt16Chunks(chunks: Int16Array[]): Int16Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const pcm = new Int16Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    pcm.set(chunk, offset);
    offset += chunk.length;
  }
  return pcm;
}

export function pcmInt16ToAudioBlob(pcm: Int16Array): Blob {
  const bytes = new Uint8Array(pcm.byteLength);
  bytes.set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
  if (typeof File !== "undefined") {
    return new File([bytes], "audio.pcm", { type: "audio/pcm" });
  }
  return new Blob([bytes], { type: "audio/pcm" });
}

export function appendPcmChunk(
  chunks: Int16Array[],
  totalSamples: number,
  chunk: Int16Array,
  maxSamples = MAX_DICTATION_PCM_SAMPLES,
): number {
  if (totalSamples >= maxSamples) return totalSamples;
  const remaining = maxSamples - totalSamples;
  if (chunk.length <= remaining) {
    chunks.push(chunk);
    return totalSamples + chunk.length;
  }
  chunks.push(chunk.subarray(0, remaining));
  return maxSamples;
}

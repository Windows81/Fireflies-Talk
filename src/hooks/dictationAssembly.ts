import { processDictationAudio, startDictation } from "./dictationApi";
import { DICTATION_CANCELLED_MESSAGE } from "./dictationErrors";
import {
  appendPcmChunk,
  concatInt16Chunks,
  MIN_DICTATION_PCM_SAMPLES,
  pcmInt16ToAudioBlob,
  startDictationPcmCapture,
} from "./dictationPcm";
import type {
  DictationSession,
  StartDictationSessionOptions,
} from "./dictationSession";

/**
 * Mic-first AssemblyAI session: capture PCM locally, call `/start` on
 * `connect()`, then upload via `/process` on `commit()`.
 */
export function startAssemblyDictationSession(
  stream: MediaStream,
  options?: StartDictationSessionOptions,
): DictationSession {
  let closed = false;
  let readySettled = false;
  let connectStarted = false;
  let rejectReady: ((error: Error) => void) | null = null;
  let resolveReady: (() => void) | null = null;
  let dictationId: string | undefined;
  const pcmChunks: Int16Array[] = [];
  let totalSamples = 0;
  const connectImmediately = options?.connectImmediately !== false;

  const capture = startDictationPcmCapture(stream, (pcm) => {
    if (closed) return;
    totalSamples = appendPcmChunk(pcmChunks, totalSamples, pcm);
  });

  const failReady = (error: Error) => {
    if (readySettled) return;
    readySettled = true;
    const reject = rejectReady;
    resolveReady = null;
    rejectReady = null;
    reject?.(error);
  };

  const succeedReady = () => {
    if (readySettled) return;
    readySettled = true;
    const resolve = resolveReady;
    resolveReady = null;
    rejectReady = null;
    resolve?.();
  };

  const openSession = async () => {
    try {
      const result = await startDictation();
      dictationId = result.dictationId;
      if (closed) {
        failReady(new Error(DICTATION_CANCELLED_MESSAGE));
        return;
      }
      succeedReady();
    } catch (error) {
      failReady(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const connect = () => {
    if (connectStarted || closed) return;
    connectStarted = true;
    void openSession();
  };

  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  if (connectImmediately) connect();

  ready.catch(() => {
    // Errors are surfaced by the caller awaiting `ready` / `commit`.
  });

  return {
    ready,
    get dictationId() {
      return dictationId;
    },
    get hasConnected() {
      return connectStarted;
    },
    connect,
    commit: async () => {
      connect();
      await ready;
      if (closed) {
        throw new Error(DICTATION_CANCELLED_MESSAGE);
      }

      capture.close();

      try {
        if (totalSamples < MIN_DICTATION_PCM_SAMPLES) {
          return { cleanedText: "" };
        }

        const context = (await options?.getCommitContext?.()) ?? {};
        const result = await processDictationAudio({
          audio: pcmInt16ToAudioBlob(concatInt16Chunks(pcmChunks)),
          screenContext: context.screenContext,
          releasedKeyAt: context.releasedKeyAt,
          dictationId,
          disableFormatting: context.disableFormatting,
        });

        if (context.disableFormatting) {
          const raw = result.rawText || result.cleanedText;
          return { rawText: raw, dictationId };
        }
        return {
          cleanedText: result.cleanedText,
          rawText: result.rawText,
          dictationId,
        };
      } finally {
        pcmChunks.length = 0;
      }
    },
    cancel: () => {
      if (!closed) {
        closed = true;
        capture.close();
        pcmChunks.length = 0;
      }
      failReady(new Error(DICTATION_CANCELLED_MESSAGE));
    },
  };
}

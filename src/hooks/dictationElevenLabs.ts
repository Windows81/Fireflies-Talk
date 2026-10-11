import {
  AudioFormat,
  CommitStrategy,
  RealtimeEvents,
  type CommittedTranscriptMessage,
  type RealtimeConnection,
  type ScribeAuthErrorMessage,
  type ScribeErrorMessage,
} from "@elevenlabs/client";
import { getDictationLanguageHints } from "@/features/settings";
import { fetchDictationScribeToken } from "./dictationApi";
import { DICTATION_CANCELLED_MESSAGE } from "./dictationErrors";
import {
  joinCommittedTranscriptSegments,
  recordCommittedTranscriptSegment,
} from "./dictationElevenLabsTranscript";
import {
  DICTATION_PCM_CHUNK_SAMPLES,
  DICTATION_PCM_SAMPLE_RATE,
  startDictationPcmCapture,
} from "./dictationPcm";
import { connectScribeRealtime } from "./dictationScribeConnect";
import type {
  DictationSession,
  StartDictationSessionOptions,
} from "./dictationSession";

const COMMIT_TIMEOUT_MS = 60_000;
const CONNECT_TIMEOUT_MS = 15_000;
// 30s of queued audio covers token fetch + websocket connect at any chunk size.
const MAX_PCM_QUEUE_SECONDS = 30;
const MAX_PCM_QUEUE_CHUNKS = Math.ceil(
  (MAX_PCM_QUEUE_SECONDS * DICTATION_PCM_SAMPLE_RATE) /
    DICTATION_PCM_CHUNK_SAMPLES,
);

function scribeErrorMessage(
  error: ScribeErrorMessage | ScribeAuthErrorMessage,
) {
  return error.error || "ElevenLabs request failed";
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function pcmChunkToBase64(pcm: Int16Array): string {
  return uint8ToBase64(
    new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength),
  );
}

/**
 * Mic-first ElevenLabs session: start capturing immediately, queue PCM until
 * SESSION_STARTED, then flush. The caller can show "recording" UI before
 * awaiting `ready`. Pass `scribeCredentials` to start `/token` at key-down.
 * Pass `connectImmediately: false` to buffer audio without opening a Scribe
 * session (macOS Fn-down before the hold is confirmed).
 */
export function startElevenLabsDictationSession(
  stream: MediaStream,
  options?: StartDictationSessionOptions,
): DictationSession {
  let connection: RealtimeConnection | null = null;
  let sessionReady = false;
  let closed = false;
  let readySettled = false;
  let connectStarted = false;
  let rejectReady: ((error: Error) => void) | null = null;
  let resolveReady: (() => void) | null = null;
  let awaitingFinalCommit = false;
  let resolveFinalCommit: ((text: string) => void) | null = null;
  let dictationId: string | undefined;
  const pcmQueue: string[] = [];
  const committedSegments: string[] = [];
  const connectImmediately = options?.connectImmediately !== false;
  let credentialsRequest = options?.scribeCredentials ?? null;

  const sendOrQueuePcm = (audioBase64: string) => {
    if (closed) return;
    if (sessionReady && connection) {
      connection.send({ audioBase64 });
      return;
    }
    if (pcmQueue.length < MAX_PCM_QUEUE_CHUNKS) {
      pcmQueue.push(audioBase64);
    }
  };

  const capture = startDictationPcmCapture(stream, (pcm) => {
    sendOrQueuePcm(pcmChunkToBase64(pcm));
  });

  const flushPcmQueue = () => {
    if (!connection || !sessionReady) return;
    for (const chunk of pcmQueue) {
      connection.send({ audioBase64: chunk });
    }
    pcmQueue.length = 0;
  };

  const onCommittedTranscript = (data: CommittedTranscriptMessage) => {
    recordCommittedTranscriptSegment(committedSegments, data.text);
    if (!awaitingFinalCommit) return;

    awaitingFinalCommit = false;
    const resolve = resolveFinalCommit;
    resolveFinalCommit = null;
    resolve?.(joinCommittedTranscriptSegments(committedSegments));
  };

  const closeConnection = () => {
    if (closed) return;
    closed = true;
    sessionReady = false;
    awaitingFinalCommit = false;
    resolveFinalCommit = null;
    pcmQueue.length = 0;
    connection?.off(RealtimeEvents.COMMITTED_TRANSCRIPT, onCommittedTranscript);
    connection?.close();
    connection = null;
  };

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
    sessionReady = true;
    flushPcmQueue();
    const resolve = resolveReady;
    resolveReady = null;
    rejectReady = null;
    resolve?.();
  };

  const openScribeConnection = async () => {
    try {
      const credentials = await (credentialsRequest ??=
        fetchDictationScribeToken());
      dictationId = credentials.dictationId;
      if (closed) {
        failReady(new Error(DICTATION_CANCELLED_MESSAGE));
        return;
      }

      // Language hints go through secondary_languages so Scribe can still
      // auto-detect and switch among the selected languages mid-session.
      const languageHints = getDictationLanguageHints();
      connection = connectScribeRealtime({
        token: credentials.token,
        modelId: "scribe_v2_realtime",
        audioFormat: AudioFormat.PCM_16000,
        sampleRate: 16_000,
        commitStrategy: CommitStrategy.MANUAL,
        enableLogging: false,
        noVerbatim: true,
        languageHints,
      });

      // Accumulate every segment for the life of the session (including
      // Scribe's ~36s auto-commits that clear the in-flight buffer).
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, onCommittedTranscript);

      const timeoutId = window.setTimeout(() => {
        cleanupWaiters();
        failReady(new Error("Timed out waiting for ElevenLabs Scribe session"));
      }, CONNECT_TIMEOUT_MS);

      const onStarted = () => {
        window.clearTimeout(timeoutId);
        cleanupWaiters();
        succeedReady();
      };
      const onError = (error: ScribeErrorMessage | ScribeAuthErrorMessage) => {
        window.clearTimeout(timeoutId);
        cleanupWaiters();
        failReady(new Error(scribeErrorMessage(error)));
      };
      const cleanupWaiters = () => {
        connection?.off(RealtimeEvents.SESSION_STARTED, onStarted);
        connection?.off(RealtimeEvents.ERROR, onError);
        connection?.off(RealtimeEvents.AUTH_ERROR, onError);
      };

      connection.on(RealtimeEvents.SESSION_STARTED, onStarted);
      connection.on(RealtimeEvents.ERROR, onError);
      connection.on(RealtimeEvents.AUTH_ERROR, onError);
    } catch (error) {
      if (error instanceof Error) {
        failReady(error);
        return;
      }
      let message: string;
      try {
        message = JSON.stringify(error);
      } catch {
        message = String(error);
      }
      failReady(new Error(message));
    }
  };

  const connect = () => {
    if (connectStarted || closed) return;
    connectStarted = true;
    void openScribeConnection();
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
      if (closed || !connection) {
        throw new Error(DICTATION_CANCELLED_MESSAGE);
      }

      const active = connection;
      capture.close();

      const rawText = await new Promise<string>((resolve, reject) => {
        const finishWithAccumulatedOrTimeout = () => {
          const text = joinCommittedTranscriptSegments(committedSegments);
          if (text) {
            resolve(text);
            return;
          }
          reject(new Error("ElevenLabs transcription timed out"));
        };

        const timeout = setTimeout(() => {
          cleanup();
          finishWithAccumulatedOrTimeout();
        }, COMMIT_TIMEOUT_MS);

        const onError = (error: ScribeErrorMessage) => {
          cleanup();
          const text = joinCommittedTranscriptSegments(committedSegments);
          if (text) {
            resolve(text);
            return;
          }
          reject(new Error(scribeErrorMessage(error)));
        };
        const cleanup = () => {
          clearTimeout(timeout);
          awaitingFinalCommit = false;
          resolveFinalCommit = null;
          active.off(RealtimeEvents.ERROR, onError);
          closeConnection();
        };

        awaitingFinalCommit = true;
        resolveFinalCommit = (text) => {
          cleanup();
          resolve(text);
        };

        active.on(RealtimeEvents.ERROR, onError);
        active.commit();
      });

      return { rawText, dictationId };
    },
    cancel: () => {
      if (!closed) {
        capture.close();
        closeConnection();
      }
      failReady(new Error(DICTATION_CANCELLED_MESSAGE));
    },
  };
}

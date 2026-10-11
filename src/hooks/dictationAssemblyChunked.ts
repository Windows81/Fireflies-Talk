import {
  ChunkedDictationSession,
  DictationCancelledError,
  createWebAudioFrameSource,
  type DictationLanguageCode,
} from "@firefliesai/dictation-ff.react-dictation";
import {
  getDictationLanguageHints,
  toProcessDictationLanguages,
} from "@/features/settings";
import { createChunkedDictationTransport } from "./dictationApi";
import { DICTATION_MAX_AUDIO_SECONDS } from "./dictationAutoStop";
import { DICTATION_CANCELLED_MESSAGE } from "./dictationErrorMessage";
import type {
  DictationSession,
  StartDictationSessionOptions,
} from "./dictationSession";

function chunkedLanguages(): DictationLanguageCode[] {
  return toProcessDictationLanguages(
    getDictationLanguageHints(),
  ) as DictationLanguageCode[];
}

export function startAssemblyChunkedDictationSession(
  stream: MediaStream,
  options?: StartDictationSessionOptions,
): DictationSession {
  let connectStarted = false;
  const languages = chunkedLanguages();
  const session = new ChunkedDictationSession({
    transport: createChunkedDictationTransport(),
    maxDurationMs: DICTATION_MAX_AUDIO_SECONDS["assembly-chunked"] * 1000,
    ...(languages.length ? { languages } : {}),
  });
  const frameSource = createWebAudioFrameSource({ stream });
  let captureStopped = false;

  const stopCapture = async () => {
    if (captureStopped) return;
    captureStopped = true;
    await frameSource.stop().catch(() => undefined);
  };

  session.startCapture();
  void frameSource
    .start((pcm) => session.pushAudio(pcm))
    .catch(() => {
      session.cancel();
      void stopCapture();
    });

  const connect = () => {
    if (connectStarted) return;
    connectStarted = true;
    session.connect();
  };

  if (options?.connectImmediately !== false) connect();

  return {
    ready: session.connected,
    get dictationId() {
      return session.getSnapshot().dictationId;
    },
    get hasConnected() {
      return connectStarted;
    },
    connect,
    commit: async () => {
      connect();
      try {
        await session.connected;
        const context = (await options?.getCommitContext?.()) ?? {};
        await stopCapture();
        const result = await session.stop({
          ...(context.screenContext
            ? { screenContext: context.screenContext }
            : {}),
          ...(context.releasedKeyAt === undefined
            ? {}
            : { releasedKeyAt: context.releasedKeyAt }),
          ...(context.disableFormatting ? { disableFormatting: true } : {}),
          provider: "assembly-chunked",
        });
        return {
          rawText: result.rawText,
          cleanedText: result.cleanedText,
          dictationId: result.dictationId,
          transcriptionTimeMs: result.metrics.stopToResultMs,
        };
      } catch (error) {
        session.cancel();
        if (
          error instanceof DictationCancelledError ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          throw new Error(DICTATION_CANCELLED_MESSAGE);
        }
        throw error;
      } finally {
        await stopCapture();
      }
    },
    cancel: () => {
      session.cancel();
      void stopCapture();
    },
  };
}

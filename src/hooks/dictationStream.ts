import type {
  DictationLanguageCode,
  DictationStreamResult,
  DictationStreamSession,
} from "@firefliesai/dictation-ff.react-dictation";
import {
  getDictationLanguageHints,
  toProcessDictationLanguages,
} from "@/features/settings";
import type { DictationScreenContext } from "electron/src/types";
import {
  DICTATION_CANCELLED_MESSAGE,
  isAbortError,
} from "./dictationErrorMessage";
import { formatStreamResultLogLine } from "./dictationLogLines";
import { startDictationPcmCapture } from "./dictationPcm";
import type {
  DictationSession,
  StartDictationSessionOptions,
} from "./dictationSession";
import { getDictationStreamClient } from "./dictationStreamClient";

// The service takes the same languages as `/process`; any other hint never reaches the stream.
function streamLanguages(): DictationLanguageCode[] {
  return toProcessDictationLanguages(
    getDictationLanguageHints(),
  ) as DictationLanguageCode[];
}

// The service rejects longer fields, and a rejected context fails the dictation.
const SCREEN_CONTEXT_LIMITS = {
  appName: 512,
  windowTitle: 512,
  visibleText: 20_000,
  siteUrl: 2_048,
} as const;

function toStreamScreenContext(
  context: DictationScreenContext,
): DictationScreenContext {
  const { visibleText, siteUrl } = context;
  return {
    appName: context.appName.slice(0, SCREEN_CONTEXT_LIMITS.appName),
    windowTitle: context.windowTitle.slice(
      0,
      SCREEN_CONTEXT_LIMITS.windowTitle,
    ),
    ...(visibleText !== undefined && {
      visibleText: visibleText.slice(0, SCREEN_CONTEXT_LIMITS.visibleText),
    }),
    ...(siteUrl !== undefined && {
      siteUrl: siteUrl.slice(0, SCREEN_CONTEXT_LIMITS.siteUrl),
    }),
  };
}

function toSessionError(error: unknown): unknown {
  return isAbortError(error) ? new Error(DICTATION_CANCELLED_MESSAGE) : error;
}

function forwardScreenContext(
  session: DictationStreamSession,
  capture: Promise<DictationScreenContext | null> | null | undefined,
): void {
  void capture?.then(
    (context) => {
      if (context) session.setScreenContext(toStreamScreenContext(context));
    },
    () => undefined,
  );
}

function logStreamResult(stopMs: number, result: DictationStreamResult): void {
  if (!__DEV__) return;
  window.electron?.logger.write(
    "info",
    "useDictation",
    formatStreamResultLogLine({ stopMs, ...result.timings }),
  );
}

/**
 * Mic-first stream session: PCM is held locally until the hold is confirmed,
 * then goes to the dictation service over the shared socket. At release the
 * service finishes the transcript and cleans it up in one round trip.
 */
export function startStreamDictationSession(
  stream: MediaStream,
  options?: StartDictationSessionOptions,
): DictationSession {
  let session: DictationStreamSession | null = null;
  let cancelled = false;
  const pending: Int16Array[] = [];
  let adoptReady!: (outcome: Promise<void>) => void;
  const ready = new Promise<void>((resolve) => {
    adoptReady = resolve;
  });
  ready.catch(() => {
    // Errors are surfaced by the caller awaiting `ready` / `commit`.
  });

  const capture = startDictationPcmCapture(stream, (pcm) => {
    if (session) {
      session.pushAudio(pcm);
      return;
    }
    pending.push(pcm);
  });

  const connect = () => {
    if (session || cancelled) return;
    const languages = streamLanguages();
    const started = getDictationStreamClient().startDictation(
      languages.length ? { languages } : {},
    );
    session = started;
    pending.splice(0).forEach((pcm) => started.pushAudio(pcm));
    forwardScreenContext(started, options?.getScreenContext?.());
    adoptReady(
      started.ready.then(
        () => undefined,
        (error: unknown) => Promise.reject(toSessionError(error)),
      ),
    );
  };

  if (options?.connectImmediately !== false) connect();

  return {
    ready,
    get dictationId() {
      return session?.dictationId;
    },
    get hasConnected() {
      return session !== null;
    },
    connect,
    commit: async () => {
      connect();
      if (!session) throw new Error(DICTATION_CANCELLED_MESSAGE);
      const active = session;
      // Closing flushes the buffered tail, which must reach the server before stop.
      capture.close();
      const context = (await options?.getCommitContext?.()) ?? {};
      const stopStartedAt = Date.now();
      try {
        const result = await active.stop({
          releasedKeyAt: context.releasedKeyAt,
          recordingDurationMs: context.recordingDurationMs,
          disableFormatting: context.disableFormatting,
        });
        const stopMs = Date.now() - stopStartedAt;
        logStreamResult(stopMs, result);
        return {
          rawText: result.rawText,
          // Action mode sends the words as spoken, so a cleaned version must not replace them.
          ...(!context.disableFormatting && {
            cleanedText: result.cleanedText,
          }),
          dictationId: result.dictationId,
          transcriptionTimeMs: stopMs,
        };
      } catch (error) {
        throw toSessionError(error);
      }
    },
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      capture.close();
      pending.length = 0;
      if (session) {
        session.cancel();
        return;
      }
      adoptReady(Promise.reject(new Error(DICTATION_CANCELLED_MESSAGE)));
    },
  };
}

import type { DictationTranscriptionProvider } from "@/features/settings";
import type { DictationScreenContext } from "electron/src/types";
import { startAssemblyDictationSession } from "./dictationAssembly";
import { startAssemblyChunkedDictationSession } from "./dictationAssemblyChunked";
import { startElevenLabsDictationSession } from "./dictationElevenLabs";
import { startStreamDictationSession } from "./dictationStream";

export type DictationCommitInput = {
  screenContext?: DictationScreenContext | null;
  releasedKeyAt?: string;
  disableFormatting?: boolean;
  recordingDurationMs?: number;
};

export type DictationCommitResult = {
  /** Present for ElevenLabs Scribe, `/process` and the stream. */
  rawText?: string;
  /** Present when the server already formatted the transcript (`/process`, stream). */
  cleanedText?: string;
  dictationId?: string;
  /** Release-to-result ms from the chunked or stream client, when it measured that wait. */
  transcriptionTimeMs?: number;
};

export interface DictationSession {
  /** Resolves once the provider session is ready (audio may already be queued). */
  ready: Promise<void>;
  /** Correlation id from `/token`, `/start` or the stream's `ready`; set once it arrives. */
  readonly dictationId: string | undefined;
  /** True once `connect()` has been called. */
  readonly hasConnected: boolean;
  /**
   * Start the provider session. PCM is already being captured from construction;
   * call this when the hold is confirmed so language-switch taps never hit the
   * API. Idempotent.
   */
  connect: () => void;
  commit: () => Promise<DictationCommitResult>;
  cancel: () => void;
}

export type DictationScribeCredentials = {
  token: string;
  dictationId: string;
};

export interface StartDictationSessionOptions {
  /**
   * When false, PCM is captured and queued but the provider is not contacted
   * until `connect()`. Defaults to true.
   */
  connectImmediately?: boolean;
  /** In-flight `/token` started at Talk key-down. ElevenLabs only. */
  scribeCredentials?: Promise<DictationScribeCredentials>;
  /** Assembly `/process` needs screen context and key-up time at commit. */
  getCommitContext?: () => Promise<DictationCommitInput>;
  /** Stream sends the screen capture as soon as it lands, ahead of the release. */
  getScreenContext?: () => Promise<DictationScreenContext | null> | null;
}

export function startDictationSession(
  stream: MediaStream,
  provider: DictationTranscriptionProvider,
  options?: StartDictationSessionOptions,
): DictationSession {
  switch (provider) {
    case "assembly":
      return startAssemblyDictationSession(stream, options);
    case "assembly-chunked":
      return startAssemblyChunkedDictationSession(stream, options);
    case "elevenlabs":
      return startElevenLabsDictationSession(stream, options);
    case "stream":
      return startStreamDictationSession(stream, options);
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

import {
  createRestClientTransport,
  type DictationApi as ChunkedDictationApi,
  type DictationTransport,
} from "@firefliesai/dictation-ff.react-dictation";
import {
  DictationApi,
  type CreateDictationTokenResult,
  type ProcessDictationDto,
  type ProcessDictationResult,
  type StartDictationResult,
} from "@firefliesai/dictation-ff.rest-client";
import type { DictationScreenContext } from "electron/src/types";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";
import { Config } from "@/constants";
import { authApi } from "@/features/auth";
import {
  getDictationLanguageHints,
  toDictationApiLanguageCodes,
  toProcessDictationLanguages,
} from "@/features/settings";
import { getRequestMetadataHeaders } from "@/utils/request";
import { remapTimedOutAbortError } from "./dictationErrors";
import {
  buildDictationFeedbackPayload,
  type DictationFeedbackPayload,
} from "./dictationFeedbackPayload";
import {
  buildFormatDictationDto,
  type FormatDictationPayload,
} from "./dictationFormatDto";

const DICTATION_SERVICE_NAME = "desktop";

function getDictationFetch(): typeof globalThis.fetch {
  // Use native fetch for web/electron, expo fetch for React Native.
  return (
    Platform.OS === "web" ? fetch.bind(globalThis) : expoFetch
  ) as typeof globalThis.fetch;
}

/** Authenticated DictationApi pointed at Config.DICTATION_URL. */
export async function createDictationApi(): Promise<DictationApi> {
  const tokens = await authApi.getOrRefreshTokens();
  return new DictationApi({
    baseUrl: Config.DICTATION_URL.replace(/\/$/, ""),
    serviceName: DICTATION_SERVICE_NAME,
    token: tokens?.accessToken || undefined,
    fetch: getDictationFetch(),
    headers: getRequestMetadataHeaders(),
  });
}

export function createChunkedDictationTransport(): DictationTransport {
  return createRestClientTransport(
    async () => (await createDictationApi()) as unknown as ChunkedDictationApi,
    { serviceName: DICTATION_SERVICE_NAME },
  );
}

export async function fetchDictationScribeToken(): Promise<CreateDictationTokenResult> {
  const api = await createDictationApi();
  const data = await api.createDictationToken(
    { "x-service": DICTATION_SERVICE_NAME },
    { throwOnError: true },
  );

  if (!data?.token) {
    throw new Error("Dictation scribe token response missing token");
  }
  if (!data.dictationId) {
    throw new Error("Dictation scribe token response missing dictationId");
  }
  return data;
}

/** The cheapest call the dictation service answers; keeps its connection warm. */
export async function pingDictationService(): Promise<void> {
  const api = await createDictationApi();
  await api.getLiveness({ throwOnError: true });
}

export async function startDictation(): Promise<StartDictationResult> {
  const api = await createDictationApi();
  const data = await api.startDictation(
    { "x-service": DICTATION_SERVICE_NAME },
    { throwOnError: true },
  );

  if (!data?.dictationId) {
    throw new Error("Dictation start response missing dictationId");
  }
  return data;
}

export async function processDictationAudio(args: {
  audio: Blob;
  screenContext?: DictationScreenContext | null;
  releasedKeyAt?: string;
  dictationId?: string;
  disableFormatting?: boolean;
}): Promise<ProcessDictationResult> {
  const api = await createDictationApi();
  const languages = toProcessDictationLanguages(getDictationLanguageHints());
  const processDictationDto: ProcessDictationDto = {
    audio: args.audio,
    ...(args.screenContext ? { screenContext: args.screenContext } : {}),
    ...(args.releasedKeyAt && { releasedKeyAt: args.releasedKeyAt }),
    ...(args.dictationId && { dictationId: args.dictationId }),
    ...(languages.length && {
      languages: languages as ProcessDictationDto["languages"],
    }),
    ...(args.disableFormatting && { disableFormatting: true }),
  };
  const data = await api.processDictation(
    {
      "x-service": DICTATION_SERVICE_NAME,
      processDictationDto,
    },
    { throwOnError: true },
  );
  if (!data) {
    throw new Error("Dictation process response missing body");
  }
  return data;
}

export type FormatDictationTextResult = {
  cleanedText?: string;
  /** The service's own time for the request, from the timings it returns. */
  serverMs?: number;
};

export async function formatDictationText(
  rawText: string,
  options: Omit<FormatDictationPayload, "rawText"> = {},
): Promise<FormatDictationTextResult> {
  const api = await createDictationApi();
  const languages =
    options.languages ??
    toDictationApiLanguageCodes(getDictationLanguageHints());
  const data = await api.formatDictation(
    {
      "x-service": DICTATION_SERVICE_NAME,
      formatDictationDto: buildFormatDictationDto({
        rawText,
        ...options,
        languages,
      }),
    },
    { throwOnError: true },
  );
  // The installed client predates the `timings` field the service now returns.
  const serverMs = (data as { timings?: { totalMs?: number } } | undefined)
    ?.timings?.totalMs;
  return {
    cleanedText: data?.cleanedText?.trim() || undefined,
    ...(typeof serverMs === "number" && { serverMs: Math.round(serverMs) }),
  };
}

export type SendDictationFeedbackInput = DictationFeedbackPayload;

const FEEDBACK_TIMEOUT_MS = 30 * 1000;

function abortError(): Error {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

async function abortable<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) throw abortError();

  let onAbort: (() => void) | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        onAbort = () => reject(abortError());
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
  } finally {
    if (onAbort) signal.removeEventListener("abort", onAbort);
  }
}

export async function sendDictationFeedback(
  input: SendDictationFeedbackInput,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onExternalAbort);
  if (options?.signal?.aborted) controller.abort();

  try {
    const api = await abortable(createDictationApi(), controller.signal);
    await api.submitDictationFeedback(
      {
        feedbackDictationDto: buildDictationFeedbackPayload(input),
      },
      { throwOnError: true, signal: controller.signal },
    );
  } catch (error: unknown) {
    throw remapTimedOutAbortError(error, options?.signal);
  } finally {
    clearTimeout(timeoutId);
    options?.signal?.removeEventListener("abort", onExternalAbort);
  }
}

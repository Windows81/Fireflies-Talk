import type {
  DictationStreamError,
  DictationStreamFailureCode,
} from "@firefliesai/dictation-ff.react-dictation";

export const DICTATION_CANCELLED_MESSAGE = "Dictation session was cancelled";

export function isDictationCancelledError(error: unknown): boolean {
  return (
    error instanceof Error && error.message === DICTATION_CANCELLED_MESSAGE
  );
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function remapTimedOutAbortError(
  error: unknown,
  externalSignal?: AbortSignal,
): unknown {
  if (isAbortError(error) && !externalSignal?.aborted) {
    return new Error("Dictation feedback timed out");
  }
  return error;
}

const OFFLINE_MARKERS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "load failed",
  "econnrefused",
  "enotfound",
  "econnreset",
  "err_connection",
  "err_name_not_resolved",
  "socket hang up",
];

const MESSAGES = {
  offline: "Couldn't connect. Check your connection and try again.",
  signInExpired: "Sign-in expired. Sign in again and try again.",
  noAccess: "You don't have access to dictation.",
  tooLong: "That recording was too long. Try a shorter one.",
  tooManyTries: "Too many tries. Wait a moment and try again.",
  timedOut: "That took too long. Try again.",
  serverError: "Something went wrong. Try again.",
  badRequest: "Couldn't process that recording. Try again.",
  fallback: "Couldn't transcribe that. Try again.",
} as const;

const STREAM_ERROR_MESSAGES: Record<DictationStreamFailureCode, string> = {
  unauthenticated: MESSAGES.signInExpired,
  forbidden: MESSAGES.noAccess,
  auth_mismatch: MESSAGES.serverError,
  too_many_connections: MESSAGES.tooManyTries,
  rate_limited: MESSAGES.tooManyTries,
  invalid_message: MESSAGES.badRequest,
  already_active: MESSAGES.serverError,
  not_active: MESSAGES.serverError,
  buffer_overflow: MESSAGES.timedOut,
  max_duration: MESSAGES.tooLong,
  provider_error: MESSAGES.fallback,
  provider_unavailable: MESSAGES.serverError,
  internal: MESSAGES.serverError,
  connect_timeout: MESSAGES.offline,
  connection_closed: MESSAGES.offline,
  stop_timeout: MESSAGES.timedOut,
  audio_overflow: MESSAGES.offline,
};

// A socket the server closed on its own says why in the close code.
const STREAM_CLOSE_MESSAGES: Partial<Record<number, string>> = {
  4001: MESSAGES.signInExpired,
  4003: MESSAGES.noAccess,
  4008: MESSAGES.tooManyTries,
  4029: MESSAGES.tooManyTries,
};

// Matched by name so this module does not load the client library.
function streamErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error) || error.name !== "DictationStreamError") {
    return undefined;
  }
  const { code, closeCode } = error as DictationStreamError;
  const fromClose =
    closeCode === undefined ? undefined : STREAM_CLOSE_MESSAGES[closeCode];
  return fromClose ?? STREAM_ERROR_MESSAGES[code];
}

function stringFromUnknown(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (!Array.isArray(value)) return "";
  return value.map(stringFromUnknown).filter(Boolean).join(" ");
}

function errorStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number" && Number.isFinite(statusCode)) {
    return statusCode;
  }
  if (typeof statusCode === "string" && /^\d{3}$/.test(statusCode)) {
    return Number(statusCode);
  }
  return undefined;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error !== "object" || error === null) return "";

  const record = error as Record<string, unknown>;
  const fromFields = stringFromUnknown(
    record.errorMessage ?? record.message ?? record.error,
  );
  if (fromFields && fromFields !== "[object Object]") return fromFields;

  const statusCode = errorStatusCode(error);
  return statusCode ? String(statusCode) : "";
}

function messageForStatus(statusCode: number | undefined): string | undefined {
  if (statusCode === undefined) return undefined;
  if (statusCode === 401) return MESSAGES.signInExpired;
  if (statusCode === 403) return MESSAGES.noAccess;
  if (statusCode === 413) return MESSAGES.tooLong;
  if (statusCode === 429) return MESSAGES.tooManyTries;
  if (statusCode === 504) return MESSAGES.timedOut;
  if (statusCode >= 500) return MESSAGES.serverError;
  if (statusCode >= 400) return MESSAGES.badRequest;
  return undefined;
}

/** Maps fetch / token / process / stream failures to a short user-facing sentence. */
export function formatDictationServiceError(error: unknown): string {
  const fromStream = streamErrorMessage(error);
  if (fromStream) return fromStream;

  const statusCode = errorStatusCode(error);
  const message = errorText(error);
  const haystack = `${statusCode ?? ""} ${message}`.toLowerCase();

  if (OFFLINE_MARKERS.some((marker) => haystack.includes(marker))) {
    return MESSAGES.offline;
  }
  if (haystack.includes("unauthorized") || haystack.includes("401")) {
    return MESSAGES.signInExpired;
  }
  if (
    haystack.includes("timed out") ||
    haystack.includes("timeout") ||
    haystack.includes("504")
  ) {
    return MESSAGES.timedOut;
  }

  const fromStatus = messageForStatus(statusCode);
  if (fromStatus) return fromStatus;

  if (haystack.includes("forbidden") || haystack.includes("403")) {
    return MESSAGES.noAccess;
  }
  if (haystack.includes("429") || haystack.includes("too many")) {
    return MESSAGES.tooManyTries;
  }
  if (
    haystack.includes("502") ||
    haystack.includes("503") ||
    haystack.includes("500") ||
    haystack.includes("bad gateway")
  ) {
    return MESSAGES.serverError;
  }
  if (
    haystack.includes("400") ||
    haystack.includes("422") ||
    haystack.includes("bad request")
  ) {
    return MESSAGES.badRequest;
  }

  return MESSAGES.fallback;
}

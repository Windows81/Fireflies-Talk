import {
  sanitizeMetadata,
  sanitizeText,
  sanitizeValue,
} from "@/logger/sanitizer";

type UnknownRecord = Record<string, unknown>;

// These Sentry-owned contexts contain correlation IDs used by Sentry itself.
const SENTRY_CONTEXT_KEYS_TO_PRESERVE = new Set([
  "trace",
  "otel",
  "profile",
  "replay",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeOptionalText(value: unknown): unknown {
  return typeof value === "string" ? sanitizeText(value) : value;
}

function sanitizeRecord<T>(record: T): T {
  return isRecord(record) ? (sanitizeMetadata(record) as T) : record;
}

function sanitizeValueList(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map((item) => sanitizeValue(item))
    : value;
}

function sanitizeTextList(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map((item) => sanitizeOptionalText(item))
    : value;
}

function sanitizeTags(tags: unknown): unknown {
  if (!isRecord(tags)) return tags;

  const sanitizedTags: UnknownRecord = {};
  for (const [key, value] of Object.entries(tags)) {
    sanitizedTags[key] = sanitizeOptionalText(value);
  }
  return sanitizedTags;
}

export function sanitizeSentryContext<T>(context: T): T {
  return sanitizeRecord(context);
}

export function sanitizeSentryTagValue<T>(value: T): T {
  return sanitizeOptionalText(value) as T;
}

function sanitizeContexts<T>(contexts: T): T {
  if (!isRecord(contexts)) return contexts;

  const sanitizedContexts: UnknownRecord = {};
  for (const [key, value] of Object.entries(contexts)) {
    sanitizedContexts[key] = SENTRY_CONTEXT_KEYS_TO_PRESERVE.has(key)
      ? value
      : sanitizeRecord(value);
  }
  return sanitizedContexts as T;
}

function sanitizeRequest<T>(request: T): T {
  if (!isRecord(request)) return request;

  return {
    ...request,
    url: sanitizeOptionalText(request.url),
    data: sanitizeValue(request.data),
    query_string: sanitizeValue(request.query_string),
    cookies: sanitizeValue(request.cookies),
    env: sanitizeRecord(request.env),
    headers: sanitizeRecord(request.headers),
  } as T;
}

function sanitizeMechanism<T>(mechanism: T): T {
  if (!isRecord(mechanism)) return mechanism;

  return {
    ...mechanism,
    source: sanitizeOptionalText(mechanism.source),
    data: sanitizeRecord(mechanism.data),
  } as T;
}

function sanitizeStackFrame<T>(frame: T): T {
  if (!isRecord(frame)) return frame;

  return {
    ...frame,
    context_line: sanitizeOptionalText(frame.context_line),
    pre_context: sanitizeTextList(frame.pre_context),
    post_context: sanitizeTextList(frame.post_context),
    vars: sanitizeRecord(frame.vars),
  } as T;
}

function sanitizeStacktrace<T>(stacktrace: T): T {
  if (!isRecord(stacktrace)) return stacktrace;

  return {
    ...stacktrace,
    frames: Array.isArray(stacktrace.frames)
      ? stacktrace.frames.map(sanitizeStackFrame)
      : stacktrace.frames,
  } as T;
}

function sanitizeException<T>(exception: T): T {
  if (!isRecord(exception)) return exception;

  return {
    ...exception,
    value: sanitizeOptionalText(exception.value),
    mechanism: sanitizeMechanism(exception.mechanism),
    stacktrace: sanitizeStacktrace(exception.stacktrace),
  } as T;
}

export function sanitizeSentryBreadcrumb<T>(breadcrumb: T): T {
  if (!isRecord(breadcrumb)) return breadcrumb;

  return {
    ...breadcrumb,
    message: sanitizeOptionalText(breadcrumb.message),
    data: sanitizeRecord(breadcrumb.data),
  } as T;
}

function sanitizeSpan<T>(span: T): T {
  if (!isRecord(span)) return span;

  return {
    ...span,
    description: sanitizeOptionalText(span.description),
    data: sanitizeRecord(span.data),
  } as T;
}

export function sanitizeSentryEvent<T extends object>(event: T): T {
  const eventRecord = event as UnknownRecord;

  return {
    ...event,
    message: sanitizeOptionalText(eventRecord.message),
    logentry: isRecord(eventRecord.logentry)
      ? {
          ...eventRecord.logentry,
          message: sanitizeOptionalText(eventRecord.logentry.message),
          params: sanitizeValueList(eventRecord.logentry.params),
        }
      : eventRecord.logentry,
    transaction: sanitizeOptionalText(eventRecord.transaction),
    fingerprint: sanitizeTextList(eventRecord.fingerprint),
    exception: isRecord(eventRecord.exception)
      ? {
          ...eventRecord.exception,
          values: Array.isArray(eventRecord.exception.values)
            ? eventRecord.exception.values.map(sanitizeException)
            : eventRecord.exception.values,
        }
      : eventRecord.exception,
    request: sanitizeRequest(eventRecord.request),
    breadcrumbs: Array.isArray(eventRecord.breadcrumbs)
      ? eventRecord.breadcrumbs.map(sanitizeSentryBreadcrumb)
      : eventRecord.breadcrumbs,
    contexts: sanitizeContexts(eventRecord.contexts),
    extra: sanitizeRecord(eventRecord.extra),
    tags: sanitizeTags(eventRecord.tags),
    spans: Array.isArray(eventRecord.spans)
      ? eventRecord.spans.map(sanitizeSpan)
      : eventRecord.spans,
  } as T;
}

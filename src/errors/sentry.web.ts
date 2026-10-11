import * as Sentry from "@sentry/browser";
import type { FC } from "react";
import type { AuthUser } from "../features/auth";
import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryContext,
  sanitizeSentryTagValue,
} from "./sentry-sanitizer";

// Sync user/context/tags to @sentry/electron/main via IPC bridge
const electronSentry = window?.electron?.sentry;

export const init = Sentry.init;

export const captureException = Sentry.captureException;

export const captureMessage = Sentry.captureMessage;

export const setUser = (user: AuthUser | null) => {
  Sentry.setUser(user);
  electronSentry?.setUser(user as Record<string, unknown> | null);
};

export const wrapSentry = (Component: FC) => {
  return Component;
};

export const setContext = (
  name: string,
  context: Record<string, unknown> | null,
) => {
  const sanitizedContext = sanitizeSentryContext(context);
  Sentry.setContext(name, sanitizedContext);
  electronSentry?.setContext(name, sanitizedContext);
};

export const setTag = (key: string, value: string) => {
  const sanitizedValue = sanitizeSentryTagValue(value);
  Sentry.setTag(key, sanitizedValue);
  electronSentry?.setTag(key, sanitizedValue);
};

export const addBreadcrumb: typeof Sentry.addBreadcrumb = (
  breadcrumb,
  hint,
) => {
  Sentry.addBreadcrumb(sanitizeSentryBreadcrumb(breadcrumb), hint);
};

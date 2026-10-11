import { Config } from "@/constants";
import { Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import type * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { sanitizeSentryEvent } from "./sentry-sanitizer";

const logger = new Logger("sentry");

export const sentryConfig = {
  enabled: !__DEV__,
  dsn: isDesktop ? window?.electron?.sentry?.dsn : Config.SENTRY_DSN,
  normalizeDepth: 5,
  ...(Platform.OS === "web" && {
    release: isDesktop
      ? window?.electron?.sentry?.release
      : Constants.expoConfig?.extra?.fallbackSentryReleaseName,
  }),
  environment: Config.APP_ENV,
  beforeSend(event, hint) {
    const sanitizedEvent = sanitizeSentryEvent(event);

    if (hint?.originalException) {
      const error = hint.originalException;
      logger.error(error as Error, sanitizedEvent.contexts);
    }
    return sanitizedEvent;
  },
} satisfies Sentry.ReactNativeOptions;

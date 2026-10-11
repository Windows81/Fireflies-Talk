import { Paths } from "expo-file-system";
import { isDesktop } from "@/utils/device";
import { Platform } from "react-native";
import { FileLogger, LogLevel as RNFLLogLevel } from "react-native-file-logger";
import { addBreadcrumb as addSentryBreadcrumb } from "../errors/sentry";
import { webLoggerStorage } from "./web-logger-storage";
import { cloudLogService } from "./cloud-log-service";
export type { LogFileUrlMeta } from "./web-logger-storage";

export async function configureLogger() {
  if (isDesktop) return;

  if (Platform.OS === "web") {
    // Initialize web logger storage
    await webLoggerStorage.initialize({
      captureConsole: false,
      dailyRolling: false,
      maximumFileSize: 1024 * 1024, // 1MB
      maximumNumberOfFiles: 3,
    });
  } else {
    FileLogger.configure({
      captureConsole: false,
      dailyRolling: false,
      maximumFileSize: 1024 * 1024, // 1MB
      maximumNumberOfFiles: 3,
      logsDirectory: `${Paths.document.uri}logs/`.substring(`file://`.length),
    });
  }
}

type LogMetadata = {
  /**
   * https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#breadcrumb-types
   */
  type?:
    | "default"
    | "debug"
    | "error"
    | "navigation"
    | "http"
    | "info"
    | "query"
    | "transaction"
    | "ui"
    | "user";
} & Record<string, any>;

type LogLevel = "info" | "warning" | "error" | "debug";

const FILE_LOGGER_LEVEL = {
  info: RNFLLogLevel.Info,
  warning: RNFLLogLevel.Warning,
  error: RNFLLogLevel.Error,
  debug: RNFLLogLevel.Debug,
};

export class Logger {
  constructor(public tag: string) {}
  private async write(
    level: LogLevel,
    message: string,
    { type, ...metadata }: LogMetadata = {},
  ) {
    const messageStr = `[${this.tag}] ${message}`;
    const timestamp = Date.now();

    const consoleLogger = {
      info: console.info,
      warning: console.warn,
      error: console.error,
      debug: console.debug,
    }[level];

    // Always log to console in dev mode
    if (__DEV__) {
      consoleLogger(messageStr, metadata);
    }

    // Platform-specific logging
    if (Platform.OS === "web") {
      // Check if running in Electron
      if (isDesktop && window?.electron?.logger) {
        // Electron: Send logs to main process for file logging
        try {
          window.electron.logger.write(level, this.tag, message, metadata);
        } catch (error) {
          console.error("Failed to write log to Electron:", error);
        }
      } else {
        // Regular web: Use OPFS-Chrome or IDB-Safari storage
        try {
          await webLoggerStorage.write({
            timestamp,
            level,
            tag: this.tag,
            message,
            metadata,
          });
        } catch (error) {
          console.error("Failed to write log to web storage:", error);
        }
      }
    } else {
      // Native platforms: Use react-native-file-logger
      FileLogger.write(
        FILE_LOGGER_LEVEL[level],
        JSON.stringify({
          timestamp,
          level,
          message,
          tag: this.tag,
          ...metadata,
        }),
      );
      addSentryBreadcrumb({
        category: this.tag,
        message,
        data: metadata,
        level,
        type: type || (level === "error" && "error") || "default",
        timestamp: timestamp / 1000, // Sentry expects seconds
      });
    }

    // Enqueue to cloud log service (eligibility check happens inside enqueue)
    cloudLogService.enqueue({ level, tag: this.tag, message, metadata });
  }
  info(message: string, metadata?: LogMetadata) {
    this.write("info", message, metadata);
  }
  warn(message: string, metadata?: LogMetadata) {
    this.write("warning", message, metadata);
  }
  error(message: string | Error, metadata?: LogMetadata) {
    this.write("error", String(message), metadata);
  }
  debug(message: string, metadata?: LogMetadata) {
    this.write("debug", message, metadata);
  }
}

export const getLogFilePaths = async () => {
  if (Platform.OS === "web") {
    // Check if running in Electron
    if (typeof window !== "undefined" && window.electron?.logger) {
      // Get log files from Electron main process
      return window.electron.logger.getLogFiles();
    }
    return webLoggerStorage.getLogFilePaths();
  }
  return FileLogger.getLogFilePaths().then((paths) =>
    paths.map((path) => `file://${path}`),
  );
};

export const getLogUrlMeta = (url: string) => {
  if (Platform.OS !== "web") {
    throw new Error("getLogUrlMeta is only available on web platform");
  }
  // Electron doesn't use URL meta
  if (typeof window !== "undefined" && window.electron?.logger) {
    return null;
  }
  return webLoggerStorage.getUrlMeta(url);
};

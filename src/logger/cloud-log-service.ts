import { Platform } from "react-native";
import { isDesktop } from "@/utils/device";
import { sanitizeMetadata, sanitizeText } from "./sanitizer";

interface CloudLogEntry {
  level: "info" | "warning" | "error" | "debug";
  tag: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface CloudLogPayload {
  message: string;
  source: string;
  level: "error" | "warn" | "info";
  email: string;
  userId: string;
  context: string;
  metadata?: Record<string, unknown>;
}

function getRecorderType(): string {
  if (isDesktop) return "desktop-app";
  if (Platform.OS === "ios" || Platform.OS === "android") return "mobile-app";
  return "mobile-web";
}

function resolveDeviceInfo(): Record<string, unknown> | undefined {
  if (isDesktop || Platform.OS === "web") return undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Device = require("expo-device");
    return {
      brand: Device.brand,
      platform: Platform.OS,
      osVersion: Device.osVersion,
      modelName: Device.modelName,
    };
  } catch {
    return { platform: Platform.OS };
  }
}

// Computed once at module load — device properties and platform don't change at runtime.
const recorderType = getRecorderType();
const deviceInfo = resolveDeviceInfo();
// The website signs in with cookies and holds no access token, and its
// cookies never reach the log service, which is on another site. Its logs go
// out without a bearer token; desktop and the native apps send theirs.
const sendsBearerToken = recorderType !== "mobile-web";

const CLOUD_ELIGIBLE_TAGS = [
  "AudioRecord",
  "Streaming",
  "RecordingHealth",
  "BrowserMeetingChat",
  "BrowserConsent",
  "ConsentDelivery",
  "ChatKeyboard",
];

const FETCH_TIMEOUT_MS = 30 * 1000;
const BACKOFF_SCHEDULE_MS = [
  30 * 1000, // 30 seconds
  2 * 60 * 1000, // 2 minutes
  5 * 60 * 1000, // 5 minutes
  15 * 60 * 1000, // 15 minutes (cap)
];
const MAX_QUEUE_SIZE = 500;
const MAX_RETRIES = BACKOFF_SCHEDULE_MS.length; // 4 retries (30s, 2m, 5m, 15m), then drop

class CloudLogService {
  private queue: CloudLogPayload[] = [];
  private isProcessing = false;
  private retryCount = 0;
  private removeIPCListener: (() => void) | null = null;
  private appVersion = "0.0.0";

  constructor() {
    this.registerIPCListener();
    this.resolveAppVersion();
  }

  private resolveAppVersion(): void {
    if (isDesktop) {
      window.electron?.updater
        .getVersion()
        .then((v) => {
          if (v) this.appVersion = v;
        })
        .catch(() => {
          /* IPC not ready yet — keep default */
        });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAppVersion } = require("@/utils/version");
      this.appVersion = getAppVersion();
    }
  }

  enqueue(entry: CloudLogEntry): void {
    if (!this.isEligible(entry.level, entry.tag)) return;

    const payload = this.buildPayload(entry);
    if (!payload) return;

    this.queue.push(payload);
    while (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.shift();
    }

    this.processQueue();
  }

  private isEligible(level: string, tag: string): boolean {
    if (level === "error" || level === "warning") return true;
    if (level === "info" && CLOUD_ELIGIBLE_TAGS.includes(tag)) return true;
    return false;
  }

  private buildPayload(entry: CloudLogEntry): CloudLogPayload | null {
    try {
      // Lazy import to avoid circular dependencies (auth -> logger -> cloud-log-service)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useAuth } = require("@/features/auth/store");

      const { user, tokens } = useAuth.getState();
      if (!user || (sendsBearerToken && !tokens?.accessToken)) return null;

      const cloudLevel =
        entry.level === "warning" ? "warn" : (entry.level as "error" | "info");
      const messageStr = `[${entry.tag}] ${entry.message}`;

      const metadata = {
        ...deviceInfo,
        appVersion: this.appVersion,
        ...(entry.metadata ? sanitizeMetadata(entry.metadata) : undefined),
      };

      return {
        message: sanitizeText(messageStr),
        source: `[v${this.appVersion}]/${entry.tag}/${cloudLevel}`,
        level: cloudLevel,
        email: user.email,
        userId: user.id,
        context: recorderType,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    } catch {
      return null;
    }
  }

  private processQueue(): void {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    this.drainQueue()
      .catch(() => {})
      .finally(() => {
        this.isProcessing = false;
      });
  }

  private async drainQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const payload = this.queue.shift()!;
      const result = await this.sendLog(payload);

      if (result === "success") {
        this.retryCount = 0;
        continue;
      }

      if (result === "no_auth") {
        // Not authenticated — drop all queued logs, no point retrying
        this.queue.length = 0;
        this.retryCount = 0;
        return;
      }

      // Network/server failure — retry this specific message with backoff
      if (this.retryCount >= MAX_RETRIES) {
        this.retryCount = 0;
        continue; // Drop after max retries, move to next
      }

      const backoffMs = BACKOFF_SCHEDULE_MS[this.retryCount];
      this.retryCount++;
      await new Promise((r) => setTimeout(r, backoffMs));

      // Retry the same message (put it back at front)
      this.queue.unshift(payload);
    }
  }

  private async sendLog(
    payload: CloudLogPayload,
  ): Promise<"success" | "no_auth" | "failed"> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Config } = require("@/constants/config");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useAuth } = require("@/features/auth/store");

      const accessToken = useAuth.getState().tokens?.accessToken;
      if (sendsBearerToken && !accessToken) return "no_auth";

      const response = await fetch(`${Config.EXTERNAL_APPS_SERVICE_URL}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          ff_recorder_type: recorderType,
          ff_recorder_version: this.appVersion,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      return response.ok ? "success" : "failed";
    } catch (error) {
      if (__DEV__) {
        console.error("[CloudLogService] Failed to send log:", error);
      }
      return "failed";
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private registerIPCListener(): void {
    if (!isDesktop || typeof window === "undefined") return;

    const onFlush = window.electron?.cloudLog?.onFlush;
    if (typeof onFlush !== "function") return;

    this.removeIPCListener = onFlush(
      (
        batch: Array<{
          level: string;
          tag: string;
          message: string;
          metadata?: Record<string, unknown>;
        }>,
      ) => {
        for (const entry of batch) {
          this.enqueue(entry as CloudLogEntry);
        }
      },
    );
  }

  destroy(): void {
    if (this.removeIPCListener) {
      this.removeIPCListener();
      this.removeIPCListener = null;
    }
  }
}

export const cloudLogService = new CloudLogService();

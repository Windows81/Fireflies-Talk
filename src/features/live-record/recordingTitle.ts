import { BROWSER_PATTERNS } from "@/features/desktop-meeting-detection";
import type { RecordingSource } from "./types";

/** Human-readable title for an active recording based on its capture source. */
export const getRecordingTitleFromSource = (
  source?: RecordingSource,
): string => {
  const displayName = source?.displayName?.trim();
  const platform = source?.platform?.toLowerCase() || "";

  const isBrowserPlatform = BROWSER_PATTERNS.some((pattern) =>
    platform.includes(pattern),
  );

  if (platform.includes("system-audio") || platform.includes("system audio")) {
    return "Recording system audio";
  }

  if (platform.includes("slack")) {
    return "Recording Slack huddle";
  }

  if (isBrowserPlatform) {
    return `Recording audio in ${displayName || "browser"}`;
  }

  if (displayName) {
    return `Recording ${displayName}`;
  }

  if (platform) {
    return `Recording ${platform}`;
  }

  return "Recording meeting";
};

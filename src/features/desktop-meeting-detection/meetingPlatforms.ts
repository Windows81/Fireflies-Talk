/**
 * Maps process names (or partial matches) to human-friendly platform names
 * for displaying in notifications.
 */

import { IGNORED_APP_PATTERNS, MEETING_APP_PATTERNS } from "./types";
import type { PlatformDisplayName, MeetingPlatform } from "./types";

export type PlatformName = PlatformDisplayName;

/**
 * Process name patterns mapped to human-friendly platform names.
 * Order matters - more specific patterns should come first.
 */
const PLATFORM_NAME_MAP: Array<{
  pattern: string;
  platformName: PlatformName;
}> = [
  // Meeting platforms (check these first before browsers)
  { pattern: "gmeet", platformName: "Google Meet" },

  // Browsers
  { pattern: "chrome", platformName: "Google Chrome" },
  { pattern: "firefox", platformName: "Firefox" },
  { pattern: "safari", platformName: "Safari" },
  { pattern: "edge", platformName: "Microsoft Edge" },
  { pattern: "brave", platformName: "Brave" },
  { pattern: "vivaldi", platformName: "Vivaldi" },
  { pattern: "arc", platformName: "Arc" },
  { pattern: "zen", platformName: "Zen Browser" },

  // Native meeting apps
  { pattern: "zoom", platformName: "Zoom" },
  { pattern: "microsoft teams", platformName: "MS Teams" },
  { pattern: "ms-teams", platformName: "MS Teams" },
  { pattern: "msteams_", platformName: "MS Teams" },
  { pattern: "webex", platformName: "Webex" },
  { pattern: "skype", platformName: "Skype" },
  { pattern: "slack", platformName: "Slack" },
  { pattern: "whatsapp", platformName: "WhatsApp" },
  { pattern: "aircall", platformName: "Aircall" },
  { pattern: "avconferenced", platformName: "FaceTime" },
  { pattern: "discord", platformName: "Discord" },
  { pattern: "chatgpt", platformName: "ChatGPT" },
  { pattern: "comet", platformName: "Comet" },
  { pattern: "dialpad", platformName: "Dialpad" },
  { pattern: "lifesize", platformName: "Lifesize" },
  { pattern: "goto", platformName: "GoToMeeting" },
];

/** Unique human-readable names of all detectable meeting apps and browsers. */
export const DETECTABLE_PLATFORM_NAMES: PlatformName[] = [
  ...new Set(PLATFORM_NAME_MAP.map((e) => e.platformName)),
];

const PUPPET_SUPPORTED_PLATFORMS: MeetingPlatform[] = [
  "gmeet",
  "zoom",
  "microsoft teams",
  "ms-teams",
  "msteams_",
  "webex",
  "skype",
  "dialpad",
  "lifesize",
  "goto",
];

export type PlatformIconKey =
  | "gmeet"
  | "zoom"
  | "teams"
  | "chrome"
  | "slack"
  | "whatsapp"
  | "aircall"
  | "facetime"
  | "discord"
  | "chatgpt"
  | "comet";

/**
 * Get human-friendly platform name from process name or parent process name.
 * Uses lowercase includes for flexible matching.
 *
 * @param processName - The process name (e.g., "Google Chrome", "GoTo Helper")
 * @param parentProcessName - Optional parent process name for child processes
 * @returns Human-friendly platform name or the original process name if no match
 */
export function getPlatformName(
  processName: string,
  parentProcessName?: string,
): string {
  const lowerProcessName = processName.toLowerCase();
  const lowerParentName = parentProcessName?.toLowerCase();

  // Check process name first
  for (const { pattern, platformName } of PLATFORM_NAME_MAP) {
    if (lowerProcessName.includes(pattern)) {
      return platformName;
    }
  }

  // Check parent process name if available
  if (lowerParentName) {
    for (const { pattern, platformName } of PLATFORM_NAME_MAP) {
      if (lowerParentName.includes(pattern)) {
        return platformName;
      }
    }
  }

  // Fallback: return original process name if no match found
  return processName;
}

/**
 * Get a normalized process name for coordination (e.g., "chrome", "zoom")
 * Used for deduplication and correlation between browser and audio events.
 *
 * @param processName - The process name
 * @param parentProcessName - Optional parent process name
 * @returns Normalized lowercase process name
 */
export function getNormalizedProcessName(
  processName: string,
  parentProcessName?: string,
): string {
  const lowerProcessName = processName.toLowerCase();
  const lowerParentName = parentProcessName?.toLowerCase();

  // Check process name first
  for (const { pattern } of PLATFORM_NAME_MAP) {
    if (lowerProcessName.includes(pattern)) {
      return pattern;
    }
  }

  // Check parent process name if available
  if (lowerParentName) {
    for (const { pattern } of PLATFORM_NAME_MAP) {
      if (lowerParentName.includes(pattern)) {
        return pattern;
      }
    }
  }

  // Fallback: return lowercase process name
  return lowerProcessName;
}

/**
 * Check if a process name matches meeting/conferencing software patterns
 *
 * @param processName - The process name to check
 * @param parentProcessName - Optional parent process name for child processes
 * @returns true if the process is a known meeting app
 */
export function isMeetingApp(
  processName: string,
  parentProcessName?: string,
): boolean {
  const lowerName = processName.toLowerCase();
  const lowerParentName = parentProcessName?.toLowerCase();

  // Ignored apps (e.g. dictation) are never meetings, even via their parent
  if (
    IGNORED_APP_PATTERNS.some((pattern) => lowerName.includes(pattern)) ||
    (lowerParentName &&
      IGNORED_APP_PATTERNS.some((pattern) => lowerParentName.includes(pattern)))
  ) {
    return false;
  }

  const hasMatch = MEETING_APP_PATTERNS.some((pattern) =>
    lowerName.includes(pattern),
  );

  // If process name matches, return true
  if (hasMatch) return true;

  // If no match and parent process name is available, check parent
  if (lowerParentName) {
    return MEETING_APP_PATTERNS.some((pattern) =>
      lowerParentName.includes(pattern),
    );
  }

  return false;
}

/**
 * Check if a platform is supported for puppet/bot invites.
 */
export function isPuppetSupportedPlatform(
  platform: string | null | undefined,
): boolean {
  if (!platform) return false;
  const normalized = platform.toLowerCase();
  return PUPPET_SUPPORTED_PLATFORMS.some((supported) =>
    normalized.includes(supported),
  );
}

/**
 * Map a platform or display name to an icon key for notifications.
 */
export function getPlatformIconKey(
  platformOrName: string | null | undefined,
): PlatformIconKey | undefined {
  if (!platformOrName) return undefined;

  const normalized = platformOrName.toLowerCase();
  if (normalized.includes("gmeet") || normalized.includes("google meet")) {
    return "gmeet";
  }
  if (normalized.includes("zoom")) {
    return "zoom";
  }
  if (normalized.includes("teams") || normalized.includes("ms teams")) {
    return "teams";
  }
  if (normalized.includes("chrome") || normalized.includes("chromium")) {
    return "chrome";
  }
  if (normalized.includes("slack")) {
    return "slack";
  }
  if (normalized.includes("whatsapp")) {
    return "whatsapp";
  }
  if (normalized.includes("aircall")) {
    return "aircall";
  }
  if (normalized.includes("facetime") || normalized.includes("avconferenced")) {
    return "facetime";
  }
  if (normalized.includes("discord")) {
    return "discord";
  }
  if (normalized.includes("chatgpt")) {
    return "chatgpt";
  }
  if (normalized.includes("comet")) {
    return "comet";
  }

  return undefined;
}

/**
 * Extract platform from meeting URL
 */
export function getPlatformFromUrl(url: string): MeetingPlatform | null {
  if (!url) return null;

  let hostname: string | undefined;
  let parsedUrl: URL | null = null;
  try {
    // Node's URL class requires protocol for parsing, so prepend if missing
    parsedUrl = url.startsWith("http")
      ? new URL(url)
      : new URL("https://" + url);
    hostname = parsedUrl.hostname.toLowerCase();
  } catch {
    // If invalid URL, fallback to null
    return null;
  }

  // Google Meet (browser-based)
  // Accept meet.google.com and subdomains
  if (hostname === "meet.google.com" || hostname.endsWith(".meet.google.com")) {
    return "gmeet";
  }

  // Zoom - explicit regional domain checks to avoid false positives
  const zoomDomains = [
    "zoom.us", // North America
    "zoom.com", // Global
    "zoom.cn", // China
    "zoom.jp", // Japan
    "zoom.de", // Germany
    "zoom.fr", // France
    "zoom.uk", // UK
    "zoom.eu", // Europe
    "zoom.com.br", // Brazil
    "zoom.com.au", // Australia
    "zoom.com.mx", // Mexico
  ];

  for (const domain of zoomDomains) {
    if (hostname === domain || hostname.endsWith("." + domain)) {
      return "zoom";
    }
  }

  // Microsoft Teams
  if (
    hostname === "teams.microsoft.com" ||
    hostname.endsWith(".teams.microsoft.com") ||
    hostname === "teams.live.com" ||
    hostname.endsWith(".teams.live.com") ||
    hostname === "teams.cloud.microsoft" ||
    hostname.endsWith(".teams.cloud.microsoft")
  ) {
    return "microsoft teams";
  }

  // Webex
  if (hostname === "webex.com" || hostname.endsWith(".webex.com")) {
    return "webex";
  }

  // GoToMeeting
  if (
    hostname === "gotomeeting.com" ||
    hostname.endsWith(".gotomeeting.com") ||
    hostname === "gotomeet.me" ||
    hostname.endsWith(".gotomeet.me") ||
    hostname === "goto.com" ||
    hostname.endsWith(".goto.com")
  ) {
    return "goto";
  }

  // Slack Huddle
  if (hostname === "app.slack.com" || hostname.endsWith(".slack.com")) {
    const slackHuddlePattern = /^\/huddle\/.+/;
    if (parsedUrl && slackHuddlePattern.test(parsedUrl.pathname)) {
      return "slack";
    }
  }

  // Skype
  if (
    hostname === "skype.com" ||
    hostname.endsWith(".skype.com") ||
    hostname === "lync.com" ||
    hostname.endsWith(".lync.com")
  ) {
    return "skype";
  }

  // Dialpad
  if (hostname === "dialpad.com" || hostname.endsWith(".dialpad.com")) {
    return "dialpad";
  }

  // Lifesize
  if (hostname === "lifesize.com" || hostname.endsWith(".lifesize.com")) {
    return "lifesize";
  }

  return null;
}

/**
 * Matches every Teams variant: URLs resolve to "microsoft teams" while Windows
 * audio events report "ms-teams" or "msteams_". Expects a lowercased platform.
 */
export function isTeamsPlatform(platform: string): boolean {
  return (
    platform.includes("teams") ||
    platform.includes("ms-teams") ||
    platform.includes("msteams_")
  );
}

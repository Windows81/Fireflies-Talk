/**
 * Core types for desktop meeting detection
 */

export type MeetingSourceType = "browser" | "audio";

/**
 * Browsers that support URL extraction via AppleScript/automation.
 * These can provide meeting URLs for detection.
 */
export const BROWSERS_WITH_URL_SUPPORT = [
  "chrome", // Google Chrome, includes "Google Chrome" and "Chromium"
  "edge", // Microsoft Edge
  "brave", // Brave Browser
  "vivaldi", // Vivaldi
  "safari", // Safari
  "arc", // Arc (Chromium-based)
  "comet", // Comet browser (Chromium-based)
  "chatgpt-atlas", // ChatGPT Atlas (Chromium-based)
] as const;

/**
 * Browsers that only support audio detection (no URL extraction).
 * These can trigger mic-access events but cannot provide meeting URLs.
 */
export const BROWSERS_AUDIO_ONLY = [
  "firefox", // Firefox (no AppleScript support)
  "zen", // Zen Browser (no AppleScript support)
] as const;

/**
 * All supported browsers for meeting detection (URL + audio-only).
 */
export const BROWSER_PATTERNS = [
  ...BROWSERS_WITH_URL_SUPPORT,
  ...BROWSERS_AUDIO_ONLY,
] as const;

/**
 * Supported native meeting applications.
 */
export const NATIVE_APP_PATTERNS = [
  "zoom", // Zoom.us
  "microsoft teams", // Microsoft Teams macOS
  "ms-teams", // Microsoft Teams Windows (WASAPI process name)
  "msteams_", // Microsoft Teams Windows (legacy registry name)
  "webex", // WebexHelper or Webex
  "skype", // Skype for Business
  "slack", // Slack Huddles
  "dialpad", // Dialpad
  "lifesize", // Lifesize
  "goto", // GoToMeeting, "GoTo Helper"
  "whatsapp", // WhatsApp calls
  "aircall", // Aircall
  "avconferenced", // FaceTime (macOS process name)
  "discord", // Discord
] as const;

/**
 * Dictation apps that hold the microphone but are never meetings.
 * Hardcoded: always ignored by detection, not a user setting.
 */
export const IGNORED_APP_PATTERNS = ["wispr flow"] as const;

/**
 * All supported meeting platforms (browsers + native apps).
 */
export const MEETING_APP_PATTERNS = [
  ...BROWSER_PATTERNS,
  ...NATIVE_APP_PATTERNS,
] as const;

// ============================================================================
// Derived TypeScript Types (Single Source of Truth)
// ============================================================================

/**
 * Browser that supports URL extraction via AppleScript.
 * Use this type for browser-listener and URL-based detection.
 */
export type BrowserWithUrlSupport = (typeof BROWSERS_WITH_URL_SUPPORT)[number];

/**
 * Browser that only supports audio detection (no URL).
 */
export type BrowserAudioOnly = (typeof BROWSERS_AUDIO_ONLY)[number];

/**
 * Any supported browser (URL-capable or audio-only).
 */
export type SupportedBrowser = (typeof BROWSER_PATTERNS)[number];

/**
 * Native meeting application.
 */
export type SupportedNativeApp = (typeof NATIVE_APP_PATTERNS)[number];

/**
 * Any supported meeting platform (browser or native app).
 */
export type SupportedMeetingApp = (typeof MEETING_APP_PATTERNS)[number];

/**
 * Platform types that can be detected from meeting URLs or process names
 */
export type MeetingPlatform =
  | "gmeet"
  | "zoom"
  | "microsoft teams"
  | "ms-teams"
  | "msteams_"
  | "webex"
  | "goto"
  | "skype"
  | "slack"
  | "dialpad"
  | "lifesize"
  | "whatsapp"
  | "aircall"
  | "avconferenced"
  | "discord"
  | "chatgpt"
  | "comet"
  | "chrome"
  | "safari"
  | "firefox"
  | "edge"
  | "brave"
  | "vivaldi"
  | "arc"
  | "zen";

/**
 * Human-friendly platform display names
 */
export type PlatformDisplayName =
  | "Google Meet"
  | "Zoom"
  | "MS Teams"
  | "Webex"
  | "Skype"
  | "Slack"
  | "Dialpad"
  | "Lifesize"
  | "GoToMeeting"
  | "WhatsApp"
  | "Aircall"
  | "FaceTime"
  | "Discord"
  | "ChatGPT"
  | "Comet"
  | "Google Chrome"
  | "Firefox"
  | "Safari"
  | "Microsoft Edge"
  | "Brave"
  | "Vivaldi"
  | "Arc"
  | "Zen Browser";

/**
 * Meeting event detected from browser or audio source
 */
export interface MeetingEvent {
  type: MeetingSourceType;
  platform: string; // Normalized platform name (e.g., "chrome", "zoom")
  displayName: string; // Human-friendly (e.g., "Google Meet", "Zoom")
  originalUrl?: string; // For bot invocation (with query params)
  /** URL borrowed from a calendar event by enrichment, not observed. */
  urlFromCalendar?: boolean;
  normalizedUrl?: string; // For comparison/deduplication
  browserName?: string; // URL source browser (e.g., "chrome")
  processId?: number; // Audio events
  processName?: string;
  parentProcessName?: string;
  parentProcessId?: number;
  timestamp: number;
}

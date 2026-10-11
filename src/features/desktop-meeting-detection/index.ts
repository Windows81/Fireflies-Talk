// Main hook
export { useMeetingDetection } from "./useMeetingDetection";
export { useLocalMeetingRecordingSync } from "./useLocalMeetingRecordingSync";

// Store and API
export {
  useMeetingDetectionStore,
  meetingDetectionApi,
  normalizeUrl,
} from "./store";

// Types and constants
export type {
  MeetingEvent,
  MeetingSourceType,
  BrowserWithUrlSupport,
  BrowserAudioOnly,
  SupportedBrowser,
  SupportedNativeApp,
  SupportedMeetingApp,
  MeetingPlatform,
  PlatformDisplayName,
} from "./types";

export type { CalendarMeetingClaimInput, LocalMeetingRecord } from "./store";

export {
  BROWSERS_WITH_URL_SUPPORT,
  BROWSERS_AUDIO_ONLY,
  BROWSER_PATTERNS,
  NATIVE_APP_PATTERNS,
  IGNORED_APP_PATTERNS,
  MEETING_APP_PATTERNS,
} from "./types";

// Utilities
export {
  getNormalizedProcessName,
  getPlatformIconKey,
  getPlatformName,
  isPuppetSupportedPlatform,
  isMeetingApp,
  getPlatformFromUrl,
  isTeamsPlatform,
} from "./meetingPlatforms";

export {
  findCalendarTitleForDetectedMeeting,
  findCalendarTitleForActiveMeetings,
} from "./calendarTitle";
export type { DetectedMeetingIdentity } from "./calendarTitle";
export {
  isCalendarEventLive,
  meetingMatchesCalendarEvent,
  liveMeetingMatchesCalendarEvent,
  botJoinedMatchesCalendarEvent,
  isBotLiveMeeting,
  isCalendarEventClaimed,
} from "./calendarMatch";
export {
  claimCalendarMeetingFromNotificationAction,
  claimCalendarMeetingFromRecordingSource,
} from "./calendarMeetingClaim";

// Periodic cleanup
export {
  registerCleanupCallback,
  initializeMeetingStateCleanup,
  stopMeetingStateCleanup,
} from "./meetingStateCleanup";

// Audio monitor (detection mechanism)
export { useAudioMonitor } from "./audio-monitor/hooks/useAudioMonitor";
export type {
  AudioEvent,
  AudioEventHandler,
  UseAudioMonitorReturn,
} from "./audio-monitor/types";

// Browser meetings (detection mechanism)
export { useBrowserMeetings } from "./useBrowserMeetings";
export type { BrowserName, MeetingUrlWithBrowser } from "./useBrowserMeetings";

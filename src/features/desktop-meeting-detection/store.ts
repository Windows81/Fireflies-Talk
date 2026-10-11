import { showMeetingNotification } from "@/features/desktop-notifications/utils";
import { useAuth } from "@/features/auth";
import { getLocalSettings } from "@/features/settings";
import { create } from "zustand";
import { Logger } from "@/logger";
import {
  getPlatformFromUrl,
  getPlatformIconKey,
  isPuppetSupportedPlatform,
  isTeamsPlatform,
} from "./meetingPlatforms";
import { registerCleanupCallback } from "./meetingStateCleanup";
import { normalizeUrl } from "./normalizeUrl";
import type { RecordingSource } from "@/features/live-record/types";
import type { CalendarEvents, MeetingStatusData } from "@/graphql";
import { BROWSER_PATTERNS, BROWSERS_AUDIO_ONLY } from "./types";
import type { MeetingSourceType, MeetingEvent } from "./types";

export type { MeetingSourceType, MeetingEvent };

const logger = new Logger("desktop-meeting-detection-store");

// Timing constants
const NOTIFICATION_COOLDOWN_MS = 4000; // 4s between notifications
const CALENDAR_WINDOW_MS = 5 * 60 * 1000; // ±5 minutes for calendar matching
const CALENDAR_CACHE_GRACE_MS = 15 * 60 * 1000; // Keep dropped events for 15 minutes
const RECENT_CALENDAR_EVENTS_LIMIT = 5; // Keep the last 5 calendar events seen
const RECENT_CALENDAR_EVENTS_MEMORY_MS = 30 * 60 * 1000; // Keep recent calendar events for 30 minutes
const LOCAL_MEETING_LIMIT = 50;
const RECORDING_ENDED_DISPLAY_MS = 60 * 1000;

// Event coordination timing
const BROWSER_URL_MAX_WAIT_MS = 10_000; // Max wait for URL when automation is available
const AUDIO_CONFIRMATION_WAIT_MS = 5_000; // Wait for audio confirmation when URL arrives first

type LocalMeetingStatus =
  | "detected"
  | "dismissed"
  | "recording"
  | "invited"
  | "ended";

type LocalMeetingEndedReason = "mic" | "recording";

export interface CalendarMeetingClaimInput {
  eventId: string;
  url?: string;
  platform?: string;
  until: number;
}

interface ClaimedCalendarMeeting {
  eventId: string;
  normalizedUrl?: string;
  platform?: string;
  until: number;
}

/**
 * Pending event coordination for merging audio and browser events.
 * Key is the browser name (e.g., "chrome") for browser-based events.
 */
interface PendingEventCoordination {
  audioEvent?: {
    event: MeetingEvent;
    receivedAt: number;
  };
  browserEvent?: {
    event: MeetingEvent;
    receivedAt: number;
  };
  timer?: ReturnType<typeof setTimeout>;
  notified: boolean;
}

// Module-level map for pending events (survives store resets for timers)
const pendingEvents = new Map<string, PendingEventCoordination>();

// Track meeting IDs that user explicitly invited bot to (from createMeetingInMediaStorageWithURL response)
const explicitlyInvitedMeetingIds = new Set<string>();

// Synchronous in-flight guard: event keys currently being processed in handleMeetingEvent's async flow.
// Prevents duplicate notifications when two events for the same meeting arrive before either completes.
const inFlightEventKeys = new Set<string>();

// Callback registered by the recording layer to handle auto-start-notes requests.
let autoStartNotesHandler: ((event: MeetingEvent) => void) | null = null;

export function registerAutoStartNotesHandler(
  fn: ((event: MeetingEvent) => void) | null,
): void {
  autoStartNotesHandler = fn;
}

function clearPendingEventTimer(key: string): void {
  const pending = pendingEvents.get(key);
  if (pending?.timer) {
    clearTimeout(pending.timer);
    pending.timer = undefined;
  }
}

function clearAllPendingEvents(): void {
  pendingEvents.forEach((pending) => {
    if (pending.timer) {
      clearTimeout(pending.timer);
    }
  });
  pendingEvents.clear();
}

/**
 * Check if a platform is a browser (any type).
 */
function isBrowserPlatform(platform: string): boolean {
  const normalized = platform.toLowerCase();
  return BROWSER_PATTERNS.some((b) => normalized.includes(b));
}

/**
 * Check if a platform is an audio-only browser (Firefox, Zen).
 */
function isAudioOnlyBrowser(platform: string): boolean {
  const normalized = platform.toLowerCase();
  return BROWSERS_AUDIO_ONLY.some((b) => normalized.includes(b));
}

/**
 * Get the coordination key for a meeting event.
 * For browsers, use the browser name. For standalone apps, use the platform.
 */
function getCoordinationKey(event: MeetingEvent): string {
  if (event.browserName) {
    return event.browserName.toLowerCase();
  }
  return event.platform.toLowerCase();
}

export type LocalMeetingRecord = {
  id: string;
  event: MeetingEvent;
  status: LocalMeetingStatus;
  createdAt: number;
  updatedAt: number;
  endedAt?: number;
  endedReason?: LocalMeetingEndedReason;
  recordingMeetingId?: string;
};

const localMeetingCleanupTimers = new Map<
  string,
  ReturnType<typeof setTimeout>
>();

interface MeetingDetectionState {
  lastNotification: {
    timestamp: number;
    key: string | null;
  } | null;
  localMeetings: LocalMeetingRecord[];
  recentCalendarEvents: CalendarEvents[]; // Recently seen calendar events (small memory to avoid API drops)
  calendarEvents: CalendarEvents[]; // Calendar events for checking auto-join
  claimedCalendarMeetings: ClaimedCalendarMeeting[]; // User already acted on these calendar notifications
  calendarEventsLoaded: boolean; // Whether calendar events have finished initial load
  liveMeetings: MeetingStatusData[]; // Currently active live meetings
  refetchLiveMeetings: (() => Promise<MeetingStatusData[]>) | null; // Callback to refetch live meetings

  // Teams consent detection (bypasses notification filters)
  lastTeamsDetection: number | null;

  // Event coordination state
  automationAvailable: boolean; // Whether macOS automation permission is available for browsers
  audioMonitorActive: boolean; // Whether audio monitor is currently running

  // Actions
  handleMeetingEvent: (event: MeetingEvent) => void;
  handleRawAudioEvent: (event: MeetingEvent) => void; // Smart handler for audio events
  handleRawBrowserEvent: (event: MeetingEvent) => void; // Smart handler for browser URL events
  claimCalendarMeeting: (claim: CalendarMeetingClaimInput) => void;
  setAutomationAvailable: (available: boolean) => void;
  setAudioMonitorActive: (active: boolean) => void;
  upsertLocalMeeting: (event: MeetingEvent) => void;
  setLocalMeetingStatus: (
    id: string,
    status: LocalMeetingStatus,
    updates?: Partial<LocalMeetingRecord>,
  ) => void;
  markLocalMeetingDismissed: (actionUrl: string) => void;
  markLocalMeetingInvited: (actionUrl: string) => void;
  markLocalMeetingRecording: (
    source: RecordingSource,
    meetingId?: string,
  ) => void;
  markLocalMeetingEndedByProcess: (
    processId: number,
    reason?: LocalMeetingEndedReason,
  ) => void;
  markLocalMeetingEndedById: (
    id: string,
    reason?: LocalMeetingEndedReason,
  ) => void;
  setCalendarEvents: (events: CalendarEvents[]) => void;
  setCalendarEventsLoaded: (loaded: boolean) => void;
  setLiveMeetings: (meetings: MeetingStatusData[]) => void;
  setRefetchLiveMeetings: (
    refetch: (() => Promise<MeetingStatusData[]>) | null,
  ) => void;
  cleanup: () => void;
  suppressNotifications: () => void;
  resetState: () => void;
}

export { normalizeUrl };

function normalizeClaimUrl(url: string): string {
  const trimmed = url.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return normalizeUrl(withProtocol);
}

function normalizePlatform(platform?: string | null): string {
  return platform?.trim().toLowerCase() || "";
}

function getActiveCalendarMeetingClaims(
  claims: ClaimedCalendarMeeting[],
  now: number = Date.now(),
): ClaimedCalendarMeeting[] {
  return claims.filter((claim) => claim.until > now);
}

function toCalendarMeetingClaim(
  claim: CalendarMeetingClaimInput,
): ClaimedCalendarMeeting | null {
  const eventId = claim.eventId.trim();
  if (!eventId || claim.until <= Date.now()) {
    return null;
  }

  const rawUrl = claim.url?.trim();
  const platform = normalizePlatform(claim.platform);

  return {
    eventId,
    ...(rawUrl ? { normalizedUrl: normalizeClaimUrl(rawUrl) } : {}),
    ...(platform ? { platform } : {}),
    until: claim.until,
  };
}

function getLocalMeetingKey(event: MeetingEvent): string {
  if (event.processId) return `pid:${event.processId}`;
  if (event.normalizedUrl) return `url:${event.normalizedUrl}`;
  if (event.platform) return `platform:${event.platform.toLowerCase()}`;
  return `display:${event.displayName.toLowerCase()}`;
}

function clearLocalMeetingTimer(id: string): void {
  const existing = localMeetingCleanupTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    localMeetingCleanupTimers.delete(id);
  }
}

function scheduleLocalMeetingRemoval(
  id: string,
  delayMs: number,
  triggerRefetch?: boolean,
): void {
  clearLocalMeetingTimer(id);

  const timer = setTimeout(() => {
    useMeetingDetectionStore.setState((state) => ({
      localMeetings: state.localMeetings.filter((item) => item.id !== id),
    }));
    clearLocalMeetingTimer(id);
    if (triggerRefetch && typeof window !== "undefined") {
      window.electron?.triggerMainRefetch?.();
    }
  }, delayMs);

  localMeetingCleanupTimers.set(id, timer);
}

function findLocalMeetingIndex(
  items: LocalMeetingRecord[],
  event: MeetingEvent,
): number {
  if (event.processId) {
    const byProcess = items.findIndex(
      (item) => item.event.processId === event.processId,
    );
    if (byProcess !== -1) return byProcess;
  }

  if (event.normalizedUrl) {
    const byUrl = items.findIndex(
      (item) => item.event.normalizedUrl === event.normalizedUrl,
    );
    if (byUrl !== -1) return byUrl;
  }

  return items.findIndex((item) => item.id === getLocalMeetingKey(event));
}

function parsePid(value: string | null): number | undefined {
  const pid = value ? Number(value) : NaN;
  return Number.isFinite(pid) ? pid : undefined;
}

function parseMeetingFromActionUrl(actionUrl: string): Partial<MeetingEvent> {
  try {
    const parsed = new URL(actionUrl, "https://local");
    const params = parsed.searchParams;
    const meetingUrl = params.get("meetingUrl") || params.get("url") || "";
    const normalizedUrl = meetingUrl ? normalizeUrl(meetingUrl) : undefined;

    return {
      originalUrl: meetingUrl || undefined,
      normalizedUrl,
      platform: params.get("platform") || undefined,
      displayName: params.get("displayName") || "",
      processId: parsePid(params.get("processId")),
      processName: params.get("processName") || undefined,
      parentProcessName: params.get("parentProcessName") || undefined,
      parentProcessId: parsePid(params.get("parentProcessId")),
      timestamp: Date.now(),
      type: "audio",
    };
  } catch {
    return {};
  }
}

// Chromium-based browsers that can host meeting platforms
const CHROMIUM_BROWSERS = ["chrome", "edge", "brave", "vivaldi", "arc"];
// Browser-hosted meeting platforms reachable from any Chromium browser
const CHROMIUM_BRIDGED_PLATFORMS = ["gmeet", "zoom", "microsoft teams"];

/**
 * Check if event matches any currently live meeting by URL or platform
 */
function matchesLiveMeeting(
  event: MeetingEvent,
  liveMeetings: MeetingStatusData[],
): boolean {
  if (!liveMeetings || liveMeetings.length === 0) return false;

  for (const liveMeeting of liveMeetings) {
    const liveUrl = (liveMeeting.url as string) || "";

    // For events with URL: check URL match
    if (event.normalizedUrl && liveUrl) {
      const liveNormalizedUrl = normalizeUrl(liveUrl);
      if (event.normalizedUrl === liveNormalizedUrl) {
        return true;
      }
    }

    // For audio events without URL: check platform match
    if (event.type === "audio" && !event.originalUrl && liveUrl) {
      const livePlatform = getPlatformFromUrl(liveUrl);
      if (livePlatform) {
        // Direct platform match (e.g., "zoom" audio event vs "zoom" URL)
        if (livePlatform === event.platform) {
          return true;
        }
        // Chromium browser → browser-hosted platform bridging:
        // A "chrome" audio event during a live "gmeet" meeting is the same meeting
        // (mic drop/regain where URL enrichment failed)
        if (
          CHROMIUM_BROWSERS.includes(event.platform.toLowerCase()) &&
          CHROMIUM_BRIDGED_PLATFORMS.includes(livePlatform)
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Find the meeting URL from a calendar event that matches the audio event by platform and time.
 * Used to enrich native-app audio events (Zoom, Teams, etc.) that carry no URL of their own.
 */
function findCalendarUrlForEvent(
  event: MeetingEvent,
  calendarEvents: CalendarEvents[],
): string | null {
  if (!calendarEvents || calendarEvents.length === 0) return null;
  if (event.originalUrl) return null; // Already has a URL

  const now = Date.now();

  // Collect all platform-matching candidates within the time window, then pick
  // the one with the most recent start time that has already begun. When two
  // meetings of the same platform overlap, this selects the meeting the user
  // most likely just joined.
  let bestUrl: string | null = null;
  let bestStartTime = -Infinity;

  for (const calEvent of calendarEvents) {
    const eventUrl = (calEvent.url as string) || "";
    if (!eventUrl) continue;

    const startTime = calEvent.date ? new Date(calEvent.date).getTime() : 0;
    const endTime = calEvent.endDate ? new Date(calEvent.endDate).getTime() : 0;
    if (!startTime || !endTime) continue;

    const isInTimeWindow =
      (startTime >= now - CALENDAR_WINDOW_MS &&
        startTime <= now + CALENDAR_WINDOW_MS) ||
      (now >= startTime && now <= endTime);

    if (!isInTimeWindow) continue;

    const calendarPlatform = getPlatformFromUrl(eventUrl);
    if (!calendarPlatform) continue;
    const eventPlatformLower = event.platform.toLowerCase();
    const platformMatches =
      calendarPlatform === eventPlatformLower ||
      (isTeamsPlatform(calendarPlatform) &&
        isTeamsPlatform(eventPlatformLower));
    if (!platformMatches) continue;

    // Prefer already-started meetings (with 60s grace for early joiners); among those, the most recently started
    const alreadyStarted = startTime <= now + 60_000;
    const isBetter = alreadyStarted && startTime > bestStartTime;

    if (isBetter) {
      bestUrl = eventUrl;
      bestStartTime = startTime;
    }
  }

  return bestUrl;
}

function handleEventWithCalendarEnrichment(
  event: MeetingEvent,
  calendarEvents: CalendarEvents[],
  handler: (event: MeetingEvent) => void,
): void {
  const calUrl = findCalendarUrlForEvent(event, calendarEvents);
  handler(
    calUrl
      ? {
          ...event,
          originalUrl: calUrl,
          normalizedUrl: normalizeUrl(calUrl),
          urlFromCalendar: true,
        }
      : event,
  );
}

/**
 * Check if event matches a calendar meeting with auto-join enabled
 */
function matchesCalendarWithAutoJoin(
  event: MeetingEvent,
  calendarEvents: CalendarEvents[],
): boolean {
  if (!calendarEvents || calendarEvents.length === 0) return false;

  const now = Date.now();

  for (const calEvent of calendarEvents) {
    // Skip events without auto-join enabled
    if (!calEvent.fredAdded) continue;

    const eventUrl = (calEvent.url as string) || "";
    if (!eventUrl) continue;

    // Check if event is within time window
    const startTime = calEvent.date ? new Date(calEvent.date).getTime() : 0;
    const endTime = calEvent.endDate ? new Date(calEvent.endDate).getTime() : 0;

    if (!startTime || !endTime) continue;

    const isInTimeWindow =
      (startTime >= now - CALENDAR_WINDOW_MS &&
        startTime <= now + CALENDAR_WINDOW_MS) ||
      (now >= startTime && now <= endTime);

    if (!isInTimeWindow) continue;

    // Events with a URL (browser-detected or calendar-enriched audio): check URL match
    if (event.normalizedUrl) {
      const calendarNormalizedUrl = normalizeUrl(eventUrl);
      if (event.normalizedUrl === calendarNormalizedUrl) {
        return true;
      }
    }

    // Audio events without a URL: check platform match
    if (event.type === "audio" && !event.originalUrl) {
      const calendarPlatform = getPlatformFromUrl(eventUrl);
      if (calendarPlatform === event.platform) {
        return true;
      }
    }
  }

  return false;
}

function matchesClaimPlatform(
  claimPlatform: string,
  eventPlatform: string,
): boolean {
  const normalizedClaim = normalizePlatform(claimPlatform);
  const normalizedEvent = normalizePlatform(eventPlatform);
  if (!normalizedClaim || !normalizedEvent) {
    return false;
  }

  if (normalizedClaim === normalizedEvent) {
    return true;
  }

  if (isTeamsPlatform(normalizedClaim) && isTeamsPlatform(normalizedEvent)) {
    return true;
  }

  const eventIsBrowser = isBrowserPlatform(normalizedEvent);
  const claimIsBrowserHosted = CHROMIUM_BRIDGED_PLATFORMS.some((platform) =>
    normalizedClaim.includes(platform),
  );
  return eventIsBrowser && claimIsBrowserHosted;
}

function matchesClaimedCalendarMeeting(
  event: MeetingEvent,
  claims: ClaimedCalendarMeeting[],
): boolean {
  const activeClaims = getActiveCalendarMeetingClaims(claims);
  for (const claim of activeClaims) {
    if (!claim.normalizedUrl && !claim.platform) {
      return true;
    }

    if (claim.normalizedUrl && event.normalizedUrl === claim.normalizedUrl) {
      return true;
    }

    if (
      claim.normalizedUrl &&
      event.originalUrl &&
      normalizeClaimUrl(event.originalUrl) === claim.normalizedUrl
    ) {
      return true;
    }

    if (
      claim.platform &&
      matchesClaimPlatform(claim.platform, event.platform)
    ) {
      return true;
    }
  }

  return false;
}

function getNotificationKey(event: MeetingEvent): string {
  if (event.normalizedUrl) return `url:${event.normalizedUrl}`;
  if (event.processId) return `pid:${event.processId}`;
  if (event.platform) return `platform:${event.platform.toLowerCase()}`;
  return `display:${event.displayName.toLowerCase()}`;
}

/**
 * Check if we should show notification based on cooldown, deduplication, and calendar
 */
function shouldNotify(
  event: MeetingEvent,
  lastNotification: { timestamp: number; key: string | null } | null,
  calendarEvents: CalendarEvents[],
  claimedCalendarMeetings: ClaimedCalendarMeeting[],
): boolean {
  if (matchesClaimedCalendarMeeting(event, claimedCalendarMeetings)) {
    return false;
  }

  if (matchesCalendarWithAutoJoin(event, calendarEvents)) {
    return false;
  }

  const now = Date.now();
  const eventKey = getNotificationKey(event);

  if (!lastNotification) return true;

  if (now - lastNotification.timestamp < NOTIFICATION_COOLDOWN_MS) {
    if (lastNotification.key && eventKey) {
      return lastNotification.key !== eventKey;
    }
    return false;
  }

  return true;
}

function buildCaptureActionUrl(event: MeetingEvent): string {
  const params = new URLSearchParams({
    source: "notification",
  });

  if (event.processId) params.set("processId", String(event.processId));
  if (event.processName) params.set("processName", event.processName);
  if (event.parentProcessName) {
    params.set("parentProcessName", event.parentProcessName);
  }
  if (event.parentProcessId) {
    params.set("parentProcessId", String(event.parentProcessId));
  }
  if (event.platform) params.set("platform", event.platform);
  if (event.displayName) params.set("displayName", event.displayName);
  if (event.originalUrl) params.set("meetingUrl", event.originalUrl);

  return `/start-recording?${params.toString()}`;
}

function buildInviteActionUrl(event: MeetingEvent): string {
  const params = new URLSearchParams();

  if (event.originalUrl) params.set("url", event.originalUrl);
  if (event.processId) params.set("processId", String(event.processId));
  if (event.processName) params.set("processName", event.processName);
  if (event.parentProcessName) {
    params.set("parentProcessName", event.parentProcessName);
  }
  if (event.platform) params.set("platform", event.platform);
  if (event.displayName) params.set("displayName", event.displayName);

  const query = params.toString();
  return query ? `/add-to-meeting?${query}` : "/add-to-meeting";
}

function getTitlePlatformName(event: MeetingEvent): string {
  const displayName = event.displayName?.trim() || event.platform;
  const normalized = displayName.toLowerCase();

  if (normalized === "ms teams" || normalized === "microsoft teams") {
    return "Teams";
  }

  return displayName;
}

function buildMeetingNotificationPayload(event: MeetingEvent) {
  const platformIcon =
    getPlatformIconKey(event.platform) || getPlatformIconKey(event.displayName);
  const isBrowserPlatform = BROWSER_PATTERNS.some((pattern) =>
    event.platform.toLowerCase().includes(pattern),
  );
  const inviteSupported =
    isPuppetSupportedPlatform(event.platform) || isBrowserPlatform;
  const platformTitle = getTitlePlatformName(event);
  const isSlack = event.platform.toLowerCase().includes("slack");
  const hasUrl = Boolean(event.originalUrl);

  const inviteUrl = buildInviteActionUrl(event);

  const secondaryText = "Take Notes";
  let title = `${event.displayName} is live`;
  if (isSlack) {
    title = "Slack Huddle is live";
  } else if (event.type === "audio" && isBrowserPlatform && !hasUrl) {
    title = `Meeting started in ${platformTitle}`;
  } else if (isPuppetSupportedPlatform(event.platform)) {
    title = `${platformTitle} is live`;
  }
  const body = inviteSupported
    ? "Capture notes and get live suggestions"
    : "Get real-time suggestions and notes";

  return {
    title,
    body,
    titleIcon: platformIcon,
    orText: "OR",
    primaryAction: inviteSupported
      ? {
          text: "Invite Notetaker",
          url: inviteUrl,
          icon: "plus",
        }
      : {
          text: secondaryText,
          url: buildCaptureActionUrl(event),
          icon: "mic",
        },
    secondaryAction: inviteSupported
      ? {
          text: secondaryText,
          url: buildCaptureActionUrl(event),
          icon: "mic",
        }
      : undefined,
  };
}

async function showNotification(event: MeetingEvent): Promise<void> {
  const payload = buildMeetingNotificationPayload(event);
  await showMeetingNotification(payload, "system_audio");
}

export const useMeetingDetectionStore = create<MeetingDetectionState>(
  (set, get) => ({
    lastNotification: null,
    localMeetings: [],
    calendarEvents: [],
    recentCalendarEvents: [],
    claimedCalendarMeetings: [],
    calendarEventsLoaded: false,
    liveMeetings: [],
    refetchLiveMeetings: null,
    lastTeamsDetection: null,
    automationAvailable: false,
    audioMonitorActive: false,

    setAutomationAvailable: (available: boolean) => {
      set({ automationAvailable: available });
    },

    setAudioMonitorActive: (active: boolean) => {
      set({ audioMonitorActive: active });
    },

    claimCalendarMeeting: (claim: CalendarMeetingClaimInput) => {
      const normalizedClaim = toCalendarMeetingClaim(claim);
      if (!normalizedClaim) {
        return;
      }

      set((state) => {
        const activeClaims = getActiveCalendarMeetingClaims(
          state.claimedCalendarMeetings,
        );
        return {
          claimedCalendarMeetings: [
            ...activeClaims.filter(
              (item) => item.eventId !== normalizedClaim.eventId,
            ),
            normalizedClaim,
          ],
        };
      });
    },

    /**
     * Smart handler for audio events (mic_started).
     * Coordinates with browser URL events to show a single merged notification.
     *
     * Logic:
     * - Standalone app (Zoom, Teams): notify immediately
     * - Audio-only browser (Firefox, Zen): notify immediately
     * - Browser with URL support + automation available: wait for URL
     * - Browser with URL support + no automation: notify immediately
     */
    handleRawAudioEvent: (event: MeetingEvent) => {
      const state = get();
      const platform = event.platform.toLowerCase();
      const isBrowser = isBrowserPlatform(platform);

      // Standalone apps: notify immediately
      if (!isBrowser) {
        logger.info("Audio event from standalone app, notifying immediately", {
          platform,
        });
        handleEventWithCalendarEnrichment(
          event,
          state.calendarEvents,
          state.handleMeetingEvent,
        );
        return;
      }

      // Audio-only browsers (Firefox, Zen): notify immediately
      if (isAudioOnlyBrowser(platform)) {
        logger.info(
          "Audio event from audio-only browser, notifying immediately",
          {
            platform,
          },
        );
        handleEventWithCalendarEnrichment(
          event,
          state.calendarEvents,
          state.handleMeetingEvent,
        );
        return;
      }

      // Browser with URL support but no automation permission: notify immediately
      if (!state.automationAvailable) {
        logger.info(
          "Audio event from browser but no automation permission, notifying immediately",
          { platform },
        );
        handleEventWithCalendarEnrichment(
          event,
          state.calendarEvents,
          state.handleMeetingEvent,
        );
        return;
      }

      // Browser with URL support AND automation available: coordinate with browser events
      const key = getCoordinationKey(event);
      const existing = pendingEvents.get(key);

      // Browser URL was already detected before audio started — the user
      // navigated to the meeting themselves and is likely in the waiting
      // room or already on the call. Track silently without a notification.
      if (existing?.browserEvent && !existing.notified) {
        const mergedEvent: MeetingEvent = {
          ...existing.browserEvent.event,
          processId: event.processId,
          processName: event.processName,
          parentProcessName: event.parentProcessName,
          parentProcessId: event.parentProcessId,
        };

        logger.info(
          "Browser already open when audio started — suppressing notification (user likely already joined)",
          { key, url: mergedEvent.originalUrl },
        );

        clearPendingEventTimer(key);
        existing.notified = true;
        state.upsertLocalMeeting(mergedEvent);
        return;
      }

      // No pending browser event: wait for URL to arrive
      logger.info("Audio event from browser, waiting for URL", {
        key,
        automationAvailable: state.automationAvailable,
      });

      const now = Date.now();
      clearPendingEventTimer(key);

      const pendingEntry: PendingEventCoordination = {
        audioEvent: { event, receivedAt: now },
        browserEvent: existing?.browserEvent,
        notified: false,
      };

      // Set a safety timeout - URL should arrive within 10s if automation works
      pendingEntry.timer = setTimeout(() => {
        const entry = pendingEvents.get(key);
        if (entry && !entry.notified && entry.audioEvent) {
          logger.info("URL wait timeout, notifying with audio event only", {
            key,
          });
          entry.notified = true;
          const store = get();
          const audioEvent = entry.audioEvent.event;
          handleEventWithCalendarEnrichment(
            audioEvent,
            store.calendarEvents,
            store.handleMeetingEvent,
          );
        }
      }, BROWSER_URL_MAX_WAIT_MS);

      pendingEvents.set(key, pendingEntry);
    },

    /**
     * Smart handler for browser URL events.
     * Coordinates with audio events to show a single merged notification.
     *
     * Logic:
     * - Check for pending audio event for this browser: merge and notify
     * - No pending audio + audio monitor active: wait for audio confirmation
     * - No pending audio + audio monitor inactive: notify immediately
     */
    handleRawBrowserEvent: (event: MeetingEvent) => {
      const state = get();
      const key = getCoordinationKey(event);
      const existing = pendingEvents.get(key);

      // Check if we have a pending audio event to merge with
      if (existing?.audioEvent && !existing.notified) {
        // Merge browser URL into audio event and notify
        const mergedEvent: MeetingEvent = {
          ...event, // Browser event has URL info
          processId: existing.audioEvent.event.processId,
          processName: existing.audioEvent.event.processName,
          parentProcessName: existing.audioEvent.event.parentProcessName,
          parentProcessId: existing.audioEvent.event.parentProcessId,
        };

        logger.info("Merging browser event with pending audio event", {
          key,
          url: event.originalUrl,
        });

        clearPendingEventTimer(key);
        existing.notified = true;
        state.handleMeetingEvent(mergedEvent);
        return;
      }

      // No pending audio event
      if (!state.audioMonitorActive) {
        // Audio monitor not active: notify immediately with URL only
        logger.info(
          "Browser event, audio monitor inactive, notifying immediately",
          {
            key,
            url: event.originalUrl,
          },
        );
        state.handleMeetingEvent(event);
        return;
      }

      // Audio monitor active: wait for audio confirmation
      logger.info("Browser event, waiting for audio confirmation", {
        key,
        url: event.originalUrl,
      });

      const now = Date.now();
      clearPendingEventTimer(key);

      const pendingEntry: PendingEventCoordination = {
        audioEvent: existing?.audioEvent,
        browserEvent: { event, receivedAt: now },
        notified: false,
      };

      // Set timeout for audio confirmation
      pendingEntry.timer = setTimeout(() => {
        const entry = pendingEvents.get(key);
        if (entry && !entry.notified && entry.browserEvent) {
          logger.info(
            "Audio confirmation timeout, notifying with browser event only",
            {
              key,
            },
          );
          entry.notified = true;
          get().handleMeetingEvent(entry.browserEvent.event);
        }
      }, AUDIO_CONFIRMATION_WAIT_MS);

      pendingEvents.set(key, pendingEntry);
    },

    setCalendarEvents: (events: CalendarEvents[]) => {
      set((state) => {
        const now = Date.now();
        const incomingIds = new Set(
          events.map((e) => e._id).filter(Boolean) as string[],
        );

        // Retain recently-dropped events within a grace period (to avoid misses right at start time)
        const retained = (state.calendarEvents || []).filter((prev) => {
          const prevId = prev._id as string | undefined;
          if (!prevId || incomingIds.has(prevId)) return false; // it's present in new events or lacks id
          const start = prev.date ? new Date(prev.date).getTime() : 0;
          const end = prev.endDate ? new Date(prev.endDate).getTime() : 0;
          // If event is ongoing or ended very recently, retain it
          const recentlyOngoing =
            start &&
            now >= start - CALENDAR_WINDOW_MS &&
            now <= (end || start + CALENDAR_WINDOW_MS);
          const justEnded = end && now - end <= CALENDAR_CACHE_GRACE_MS;
          return recentlyOngoing || justEnded;
        });

        // Track recent events (limit + time bound) to avoid losing visibility when API drops them
        const recentCandidates = [
          ...events,
          ...(state.recentCalendarEvents || []),
        ].filter((ev) => {
          const start = ev.date ? new Date(ev.date).getTime() : 0;
          return start && now - start <= RECENT_CALENDAR_EVENTS_MEMORY_MS;
        });

        const recentMap = new Map<string, CalendarEvents>();
        const makeKey = (ev: CalendarEvents) => {
          if (ev._id) return ev._id;
          const normalizedUrl = ev.url ? normalizeUrl(ev.url) : "";
          return `${normalizedUrl}-${ev.date || ""}`;
        };
        for (const ev of recentCandidates) {
          recentMap.set(makeKey(ev), ev);
        }
        const dedupedRecent = Array.from(recentMap.values()).sort((a, b) => {
          const startA = a.date ? new Date(a.date).getTime() : 0;
          const startB = b.date ? new Date(b.date).getTime() : 0;
          return startB - startA;
        });
        const recentLimited = dedupedRecent.slice(
          0,
          RECENT_CALENDAR_EVENTS_LIMIT,
        );

        // Merge and de-duplicate by _id (prefer incoming version)
        const mergedMap = new Map<string, CalendarEvents>();
        for (const ev of retained) {
          if (ev._id) mergedMap.set(ev._id, ev);
        }
        for (const ev of events) {
          if (ev._id) mergedMap.set(ev._id, ev);
        }
        // Bring back recent (non-duplicate ids) to avoid missing auto-join checks
        for (const ev of recentLimited) {
          if (ev._id && mergedMap.has(ev._id)) continue;
          if (ev._id) {
            mergedMap.set(ev._id, ev);
          } else {
            mergedMap.set(makeKey(ev), ev);
          }
        }
        const merged = Array.from(mergedMap.values());

        return { calendarEvents: merged, recentCalendarEvents: recentLimited };
      });
    },

    setCalendarEventsLoaded: (loaded: boolean) => {
      set({ calendarEventsLoaded: loaded });
    },

    setLiveMeetings: (meetings: MeetingStatusData[]) => {
      set({ liveMeetings: meetings });
    },

    setRefetchLiveMeetings: (
      refetch: (() => Promise<MeetingStatusData[]>) | null,
    ) => {
      set({ refetchLiveMeetings: refetch });
    },

    upsertLocalMeeting: (event: MeetingEvent) => {
      set((state) => {
        const now = Date.now();
        const index = findLocalMeetingIndex(state.localMeetings, event);

        if (index !== -1) {
          const existing = state.localMeetings[index];
          if (existing.status === "ended") {
            clearLocalMeetingTimer(existing.id);
          }
          const updated: LocalMeetingRecord = {
            ...existing,
            event: {
              ...existing.event,
              ...event,
            },
            updatedAt: now,
            ...(existing.status === "ended"
              ? {
                  status: "detected",
                  endedAt: undefined,
                  endedReason: undefined,
                }
              : {}),
          };

          const next = [...state.localMeetings];
          next[index] = updated;
          return { localMeetings: next };
        }

        const newItem: LocalMeetingRecord = {
          id: getLocalMeetingKey(event),
          event,
          status: "detected",
          createdAt: now,
          updatedAt: now,
        };

        const next = [newItem, ...state.localMeetings];
        return { localMeetings: next.slice(0, LOCAL_MEETING_LIMIT) };
      });
    },

    setLocalMeetingStatus: (
      id: string,
      status: LocalMeetingStatus,
      updates?: Partial<LocalMeetingRecord>,
    ) => {
      set((state) => {
        const index = state.localMeetings.findIndex((item) => item.id === id);
        if (index === -1) return state;

        const existing = state.localMeetings[index];
        if (status !== "ended") {
          clearLocalMeetingTimer(existing.id);
        }
        const next = [...state.localMeetings];
        next[index] = {
          ...existing,
          status,
          updatedAt: Date.now(),
          ...updates,
        };
        return { localMeetings: next };
      });
    },

    markLocalMeetingDismissed: (actionUrl: string) => {
      const parsed = parseMeetingFromActionUrl(actionUrl);
      if (!parsed.processId && !parsed.normalizedUrl && !parsed.platform) {
        return;
      }
      set((state) => {
        const index = findLocalMeetingIndex(
          state.localMeetings,
          parsed as MeetingEvent,
        );
        if (index === -1) return state;

        const existing = state.localMeetings[index];
        if (existing.status === "recording" || existing.status === "invited") {
          return state;
        }

        const next = [...state.localMeetings];
        next[index] = {
          ...existing,
          status: "dismissed",
          updatedAt: Date.now(),
        };
        return { localMeetings: next };
      });
    },

    markLocalMeetingInvited: (actionUrl: string) => {
      const parsed = parseMeetingFromActionUrl(actionUrl);
      if (!parsed.processId && !parsed.normalizedUrl && !parsed.platform) {
        return;
      }
      set((state) => {
        const index = findLocalMeetingIndex(
          state.localMeetings,
          parsed as MeetingEvent,
        );
        if (index === -1) return state;

        const existing = state.localMeetings[index];
        if (existing.status === "recording") {
          return state;
        }

        const next = [...state.localMeetings];
        next[index] = {
          ...existing,
          status: "invited",
          updatedAt: Date.now(),
        };
        return { localMeetings: next };
      });
    },

    markLocalMeetingRecording: (
      source: RecordingSource,
      meetingId?: string,
    ) => {
      if (!source?.processId && !source?.meetingUrl && !source?.platform) {
        return;
      }

      const eventHint: MeetingEvent = {
        type: "audio",
        platform: source.platform || "",
        displayName: source.displayName || source.platform || "",
        originalUrl: source.meetingUrl,
        normalizedUrl: source.meetingUrl
          ? normalizeUrl(source.meetingUrl)
          : undefined,
        processId: source.processId,
        processName: source.processName,
        parentProcessName: source.parentProcessName,
        parentProcessId: source.parentProcessId,
        timestamp: Date.now(),
      };

      set((state) => {
        const index = findLocalMeetingIndex(state.localMeetings, eventHint);
        if (index === -1) return state;

        const existing = state.localMeetings[index];
        if (existing.status === "ended") {
          clearLocalMeetingTimer(existing.id);
        }
        const normalizedUrl = source.meetingUrl
          ? normalizeUrl(source.meetingUrl)
          : undefined;
        const nextEvent: MeetingEvent = {
          ...existing.event,
          ...(source.platform ? { platform: source.platform } : {}),
          ...(source.displayName ? { displayName: source.displayName } : {}),
          ...(source.meetingUrl
            ? {
                originalUrl: source.meetingUrl,
                normalizedUrl: normalizedUrl ?? existing.event.normalizedUrl,
              }
            : {}),
          ...(source.processId ? { processId: source.processId } : {}),
          ...(source.processName ? { processName: source.processName } : {}),
          ...(source.parentProcessName
            ? { parentProcessName: source.parentProcessName }
            : {}),
          ...(source.parentProcessId
            ? { parentProcessId: source.parentProcessId }
            : {}),
        };
        const next = [...state.localMeetings];
        next[index] = {
          ...existing,
          event: nextEvent,
          status: "recording",
          updatedAt: Date.now(),
          recordingMeetingId: meetingId || existing.recordingMeetingId,
        };
        return { localMeetings: next };
      });
    },

    markLocalMeetingEndedByProcess: (
      processId: number,
      reason: LocalMeetingEndedReason = "mic",
    ) => {
      set((state) => {
        const index = state.localMeetings.findIndex(
          (item) => item.event.processId === processId,
        );
        if (index === -1) return state;

        const existing = state.localMeetings[index];
        if (existing.status === "recording" && reason !== "recording") {
          return state;
        }

        const endedAt = Date.now();
        const next = [...state.localMeetings];
        next[index] = {
          ...existing,
          status: "ended",
          updatedAt: endedAt,
          endedAt,
          endedReason: reason,
        };

        if (reason === "recording") {
          scheduleLocalMeetingRemoval(
            existing.id,
            RECORDING_ENDED_DISPLAY_MS,
            true,
          );
        } else {
          scheduleLocalMeetingRemoval(existing.id, 0);
        }

        return { localMeetings: next };
      });
    },

    markLocalMeetingEndedById: (
      id: string,
      reason: LocalMeetingEndedReason = "recording",
    ) => {
      set((state) => {
        const index = state.localMeetings.findIndex((item) => item.id === id);
        if (index === -1) return state;

        const existing = state.localMeetings[index];
        if (existing.status === "recording" && reason !== "recording") {
          return state;
        }

        const endedAt = Date.now();
        const next = [...state.localMeetings];
        next[index] = {
          ...existing,
          status: "ended",
          updatedAt: endedAt,
          endedAt,
          endedReason: reason,
        };

        if (reason === "recording") {
          scheduleLocalMeetingRemoval(
            existing.id,
            RECORDING_ENDED_DISPLAY_MS,
            true,
          );
        } else {
          scheduleLocalMeetingRemoval(existing.id, 0);
        }

        return { localMeetings: next };
      });
    },

    handleMeetingEvent: (event: MeetingEvent) => {
      // Signal Teams detection before any notification filters so the consent
      // notifier can react even when the notification pipeline suppresses the event.
      // Check both platform name AND URL — browser-based Teams meetings arrive
      // with platform "chrome" but a Teams URL.
      const platformLower = event.platform.toLowerCase();
      const isTeamsByPlatform = isTeamsPlatform(platformLower);
      const urlPlatform = event.originalUrl
        ? getPlatformFromUrl(event.originalUrl)
        : null;
      const isTeamsByUrl = urlPlatform === "microsoft teams";
      const isTeams = isTeamsByPlatform || isTeamsByUrl;
      logger.info("handleMeetingEvent received", {
        platform: event.platform,
        isTeams,
        isTeamsByPlatform,
        isTeamsByUrl,
        eventType: event.type,
        processId: event.processId,
        processName: event.processName,
        originalUrl: event.originalUrl,
      });
      if (isTeams) {
        set({ lastTeamsDetection: Date.now() });
        logger.info("Teams detection signal set for consent notifier");
      }

      const eventKey = getNotificationKey(event);

      // Synchronous guard: prevent duplicate async processing for the same event
      if (inFlightEventKeys.has(eventKey)) {
        logger.info("Skipping duplicate in-flight event", { eventKey });
        return;
      }
      inFlightEventKeys.add(eventKey);

      // Refetch live meetings to get fresh data before deciding to show notification
      const processWithFreshData = async () => {
        try {
          const state = get();
          let currentLiveMeetings = state.liveMeetings;

          if (state.refetchLiveMeetings) {
            try {
              currentLiveMeetings = await state.refetchLiveMeetings();
              set({ liveMeetings: currentLiveMeetings });
            } catch (err) {
              logger.error("failed to refetch live meetings", { err });
            }
          }

          // Only skip if the detected event matches an existing live meeting
          if (matchesLiveMeeting(event, currentLiveMeetings)) {
            return;
          }

          // Read fresh state after await to avoid stale lastNotification
          const freshState = get();
          const activeClaims = getActiveCalendarMeetingClaims(
            freshState.claimedCalendarMeetings,
          );
          if (
            activeClaims.length !== freshState.claimedCalendarMeetings.length
          ) {
            set({ claimedCalendarMeetings: activeClaims });
          }

          const shouldShow = shouldNotify(
            event,
            freshState.lastNotification,
            freshState.calendarEvents,
            activeClaims,
          );
          if (!shouldShow) return;

          const settings = getLocalSettings();
          const appName = event.displayName;
          const excludedFromAutoStart =
            !!appName && settings.excludedAppsForAutoStart.includes(appName);
          const excludedFromNotification =
            !!appName && settings.excludedAppsForNotification.includes(appName);

          // Auto-start takes priority; if excluded from it, fall back to notification
          // only when the user also has notifications enabled
          const shouldAutoStart =
            !!autoStartNotesHandler &&
            settings.autoStartNotes &&
            !excludedFromAutoStart;
          const shouldNotifyApp =
            !shouldAutoStart &&
            settings.autoDetectMeetings &&
            !excludedFromNotification;

          if (!shouldAutoStart && !shouldNotifyApp) return;

          freshState.upsertLocalMeeting(event);

          if (shouldAutoStart && autoStartNotesHandler) {
            autoStartNotesHandler(event);
          } else {
            showNotification(event).catch((err) => {
              logger.error("failed to show desktop meeting notification", {
                err,
              });
            });
          }

          set({
            lastNotification: {
              timestamp: Date.now(),
              key: eventKey,
            },
          });
        } finally {
          inFlightEventKeys.delete(eventKey);
        }
      };

      processWithFreshData().catch((err) => {
        inFlightEventKeys.delete(eventKey);
        logger.error("failed to process meeting event", { err });
      });
    },

    cleanup: () => {
      localMeetingCleanupTimers.forEach((timer) => clearTimeout(timer));
      localMeetingCleanupTimers.clear();
      set({ localMeetings: [] });
    },

    suppressNotifications: () => {
      set({
        lastNotification: {
          timestamp: Date.now(),
          key: null,
        },
      });
    },

    resetState: () => {
      // Clear local meeting cleanup timers
      localMeetingCleanupTimers.forEach((timer) => clearTimeout(timer));
      localMeetingCleanupTimers.clear();
      // Clear pending event coordination
      clearAllPendingEvents();
      // Clear explicitly invited meeting IDs
      explicitlyInvitedMeetingIds.clear();
      // Clear in-flight event guard
      inFlightEventKeys.clear();
      // Reset all tracking state to initial values
      set({
        lastNotification: null,
        localMeetings: [],
        recentCalendarEvents: [],
        claimedCalendarMeetings: [],
        lastTeamsDetection: null,
      });
      logger.info("Meeting detection state reset");
    },
  }),
);

// Export API for non-hook usage
export const meetingDetectionApi = {
  handleMeetingEvent: (event: MeetingEvent) =>
    useMeetingDetectionStore.getState().handleMeetingEvent(event),
  handleRawAudioEvent: (event: MeetingEvent) =>
    useMeetingDetectionStore.getState().handleRawAudioEvent(event),
  handleRawBrowserEvent: (event: MeetingEvent) =>
    useMeetingDetectionStore.getState().handleRawBrowserEvent(event),
  claimCalendarMeeting: (claim: CalendarMeetingClaimInput) =>
    useMeetingDetectionStore.getState().claimCalendarMeeting(claim),
  setAutomationAvailable: (available: boolean) =>
    useMeetingDetectionStore.getState().setAutomationAvailable(available),
  setAudioMonitorActive: (active: boolean) =>
    useMeetingDetectionStore.getState().setAudioMonitorActive(active),
  upsertLocalMeeting: (event: MeetingEvent) =>
    useMeetingDetectionStore.getState().upsertLocalMeeting(event),
  setLocalMeetingStatus: (
    id: string,
    status: LocalMeetingStatus,
    updates?: Partial<LocalMeetingRecord>,
  ) =>
    useMeetingDetectionStore
      .getState()
      .setLocalMeetingStatus(id, status, updates),
  markLocalMeetingDismissed: (actionUrl: string) =>
    useMeetingDetectionStore.getState().markLocalMeetingDismissed(actionUrl),
  markLocalMeetingInvited: (actionUrl: string) =>
    useMeetingDetectionStore.getState().markLocalMeetingInvited(actionUrl),
  markLocalMeetingRecording: (source: RecordingSource, meetingId?: string) =>
    useMeetingDetectionStore
      .getState()
      .markLocalMeetingRecording(source, meetingId),
  markLocalMeetingEndedByProcess: (
    processId: number,
    reason?: LocalMeetingEndedReason,
  ) =>
    useMeetingDetectionStore
      .getState()
      .markLocalMeetingEndedByProcess(processId, reason),
  markLocalMeetingEndedById: (id: string, reason?: LocalMeetingEndedReason) =>
    useMeetingDetectionStore.getState().markLocalMeetingEndedById(id, reason),
  setCalendarEvents: (events: CalendarEvents[]) =>
    useMeetingDetectionStore.getState().setCalendarEvents(events),
  setCalendarEventsLoaded: (loaded: boolean) =>
    useMeetingDetectionStore.getState().setCalendarEventsLoaded(loaded),
  setLiveMeetings: (meetings: MeetingStatusData[]) =>
    useMeetingDetectionStore.getState().setLiveMeetings(meetings),
  setRefetchLiveMeetings: (
    refetch: (() => Promise<MeetingStatusData[]>) | null,
  ) => useMeetingDetectionStore.getState().setRefetchLiveMeetings(refetch),
  cleanup: () => useMeetingDetectionStore.getState().cleanup(),
  suppressNotifications: () =>
    useMeetingDetectionStore.getState().suppressNotifications(),
  resetState: () => useMeetingDetectionStore.getState().resetState(),
  getState: () => useMeetingDetectionStore.getState(),
  addExplicitlyInvitedMeetingId: (meetingId: string) => {
    explicitlyInvitedMeetingIds.add(meetingId);
  },
  isExplicitlyInvitedMeeting: (meetingId: string) =>
    explicitlyInvitedMeetingIds.has(meetingId),
  removeExplicitlyInvitedMeetingId: (meetingId: string) => {
    explicitlyInvitedMeetingIds.delete(meetingId);
  },
};

// Register store cleanup with the periodic cleanup manager
registerCleanupCallback(() => {
  meetingDetectionApi.resetState();
});

// Calendar data is per-user; drop it when the signed-in user changes.
useAuth.subscribe((state, prevState) => {
  if (prevState.user?.id === state.user?.id) return;
  useMeetingDetectionStore.setState({
    calendarEvents: [],
    recentCalendarEvents: [],
  });
});

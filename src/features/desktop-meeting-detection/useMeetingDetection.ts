// Unified desktop meeting detection:
// - Tracks browser URLs and audio events, with smart coordination to merge events.
// - Keeps a small recent calendar cache (last 5, 30 min) and ±5 min window so auto-join events
//   remain matchable even if dropped from the API at start time.
// - Skips notifications when auto-join calendar matches or matching live meeting exists.
// - Coordinates audio and browser events to show a single merged notification.
import { useEffect, useRef } from "react";
import { useMeetingDetectionStore, type MeetingEvent } from "./store";
import { registerCleanupCallback } from "./meetingStateCleanup";
import {
  useBrowserMeetings,
  type MeetingUrlWithBrowser,
} from "./useBrowserMeetings";
import { useAudioMonitor } from "./audio-monitor/hooks/useAudioMonitor";
import type { AudioEvent } from "./audio-monitor/types";
import type { CalendarEvents, MeetingStatusData } from "@/graphql";
import { useLocalSettings } from "@/features/settings";
import {
  getNormalizedProcessName,
  getPlatformName,
  isMeetingApp,
  getPlatformFromUrl,
} from "./meetingPlatforms";

/**
 * Normalize URL for comparison by removing query params, fragments, and trailing slashes
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
      .toLowerCase()
      .replace(/\/$/, "");
  } catch {
    return url.toLowerCase().replace(/\/$/, "");
  }
}

/**
 * Get display name from URL-detected platform or fallback to browser name
 */
function getDisplayNameFromUrl(url: string, browserName: string): string {
  const platform = getPlatformFromUrl(url);

  if (platform) {
    // Map platform to display name
    return getPlatformName(platform);
  }

  // Fallback to browser name
  return getPlatformName(browserName);
}

interface UseMeetingDetectionProps {
  calendarEvents?: {
    events?: CalendarEvents[];
    isLoadingEvents?: boolean;
    liveMeetings?: MeetingStatusData[];
  };
  onMeetingDetected?: (event: MeetingEvent) => void;
}

export function useMeetingDetection(props?: UseMeetingDetectionProps) {
  const {
    handleRawAudioEvent,
    handleRawBrowserEvent,
    handleMeetingEvent,
    setCalendarEvents,
    setCalendarEventsLoaded,
    setLiveMeetings,
    setAutomationAvailable,
    setAudioMonitorActive,
    markLocalMeetingEndedByProcess,
  } = useMeetingDetectionStore();
  const onMeetingDetected = props?.onMeetingDetected;
  const { autoDetectMeetings, autoStartNotes } = useLocalSettings();
  // Dispatch events when either feature is active
  const shouldDispatchEvents = autoDetectMeetings || autoStartNotes;

  // Use refs to track previous values and avoid infinite loops
  const prevEventsRef = useRef<string>("");
  const prevLiveMeetingsRef = useRef<string>("");
  const prevLoadingRef = useRef<boolean | undefined>(undefined);

  // Update calendar events and loading state in store when they change
  useEffect(() => {
    const events = props?.calendarEvents?.events || [];
    const isLoadingEvents = props?.calendarEvents?.isLoadingEvents;

    // Only update calendar events if they've actually changed
    const eventsJson = JSON.stringify(events);
    if (eventsJson !== prevEventsRef.current) {
      prevEventsRef.current = eventsJson;
      setCalendarEvents(events);
    }

    // Only update loading state if it's actually changed
    if (isLoadingEvents !== prevLoadingRef.current) {
      prevLoadingRef.current = isLoadingEvents;
      const isLoaded = !isLoadingEvents;
      setCalendarEventsLoaded(isLoaded);
    }
  }, [
    props?.calendarEvents?.events,
    props?.calendarEvents?.isLoadingEvents,
    setCalendarEvents,
    setCalendarEventsLoaded,
  ]);

  // Update live meetings in store when they change
  useEffect(() => {
    const liveMeetings = props?.calendarEvents?.liveMeetings || [];
    const liveMeetingsJson = JSON.stringify(liveMeetings);
    if (liveMeetingsJson !== prevLiveMeetingsRef.current) {
      prevLiveMeetingsRef.current = liveMeetingsJson;
      setLiveMeetings(liveMeetings);
    }
  }, [props?.calendarEvents?.liveMeetings, setLiveMeetings]);

  // Track processed URLs and PIDs to avoid duplicate events
  const processedBrowserUrls = useRef<Set<string>>(new Set());
  const processedAudioPids = useRef<Set<number>>(new Set());
  // Track active parent processes to deduplicate multiple helper PIDs from the same app
  // (e.g., Chrome spawns multiple "Google Chrome Helper" processes for one meeting)
  const activeParentProcesses = useRef<Set<string>>(new Set());
  // Grace period timers for parent process cleanup — prevents false re-detection
  // when mic briefly drops and regains (e.g., audio device switch mid-meeting)
  const parentCleanupTimers = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  // Register for periodic cleanup
  useEffect(() => {
    return registerCleanupCallback(() => {
      processedBrowserUrls.current.clear();
      processedAudioPids.current.clear();
      activeParentProcesses.current.clear();
      parentCleanupTimers.current.forEach((timer) => clearTimeout(timer));
      parentCleanupTimers.current.clear();
    });
  }, []);

  // ---------------------------
  // 1) Browser meetings (with URLs)
  // ---------------------------
  const {
    browserMeetings,
    isAvailable: browserAvailable,
    automationAvailable,
  } = useBrowserMeetings();

  const audioMonitor = useAudioMonitor();

  // Sync automation availability to store for smart event coordination
  useEffect(() => {
    setAutomationAvailable(automationAvailable);
  }, [automationAvailable, setAutomationAvailable]);

  // Sync audio monitor status to store for smart event coordination
  useEffect(() => {
    const isActive =
      audioMonitor?.isActive || audioMonitor?.isStarting || false;
    setAudioMonitorActive(isActive);
  }, [audioMonitor?.isActive, audioMonitor?.isStarting, setAudioMonitorActive]);

  useEffect(() => {
    if (!browserAvailable || !browserMeetings) return;

    const currentUrls = new Set<string>();

    browserMeetings.meetingsWithBrowser?.forEach(
      (meeting: MeetingUrlWithBrowser) => {
        if (!meeting.url) return;

        currentUrls.add(meeting.url);

        // Only process new URLs
        if (processedBrowserUrls.current.has(meeting.url)) return;

        const normalizedUrl = normalizeUrl(meeting.url);
        const browserKey = meeting.browser.toLowerCase();
        const platform = getPlatformFromUrl(meeting.url);
        const normalizedPlatform =
          platform || getNormalizedProcessName(meeting.browser);
        const displayName = getDisplayNameFromUrl(meeting.url, meeting.browser);

        const event: MeetingEvent = {
          type: "browser",
          platform: normalizedPlatform,
          displayName,
          originalUrl: meeting.url,
          normalizedUrl,
          browserName: browserKey,
          timestamp: Date.now(),
        };

        // Feed to smart event handler if auto-detect is enabled
        if (shouldDispatchEvents) {
          handleRawBrowserEvent(event);
        }

        processedBrowserUrls.current.add(meeting.url);
        onMeetingDetected?.(event);
      },
    );

    // Clean up URLs that are no longer active
    for (const url of Array.from(processedBrowserUrls.current)) {
      if (!currentUrls.has(url)) {
        processedBrowserUrls.current.delete(url);
      }
    }
  }, [
    browserAvailable,
    browserMeetings,
    handleRawBrowserEvent,
    onMeetingDetected,
    shouldDispatchEvents,
  ]);

  // ---------------------------
  // 2) Audio monitor
  // ---------------------------
  useEffect(() => {
    if (!audioMonitor) return;

    const cleanupTimers = parentCleanupTimers.current;

    const unsubscribe = audioMonitor.onAudioEvent((event: AudioEvent) => {
      // DEBUG: log all raw process names to help identify unrecognized apps
      console.log(
        `[AUDIO MONITOR] ${event.type}: processName="${event.processName}" parentProcessName="${event.parentProcessName ?? ""}"`,
      );

      if (!isMeetingApp(event.processName, event.parentProcessName)) return;

      const normalizedPlatform = getNormalizedProcessName(
        event.processName,
        event.parentProcessName,
      );
      const displayName = getPlatformName(
        event.processName,
        event.parentProcessName,
      );

      if (event.type === "mic_started") {
        if (processedAudioPids.current.has(event.processID)) return;

        // Deduplicate by parent process: Chrome spawns multiple helper PIDs for one meeting.
        // If we've already processed a different PID from the same parent, skip this one.
        const parentKey = (
          event.parentProcessName || event.processName
        ).toLowerCase();

        // Cancel any pending grace period cleanup — mic regained before grace expired
        const pendingCleanup = cleanupTimers.get(parentKey);
        if (pendingCleanup) {
          clearTimeout(pendingCleanup);
          cleanupTimers.delete(parentKey);
        }

        if (activeParentProcesses.current.has(parentKey)) {
          processedAudioPids.current.add(event.processID);
          return;
        }
        activeParentProcesses.current.add(parentKey);

        // Event-driven mode: main process enriched the event with URL lookup
        if (event.enriched) {
          const platform = event.meetingUrl
            ? getPlatformFromUrl(event.meetingUrl) || normalizedPlatform
            : normalizedPlatform;
          const enrichedDisplayName = event.meetingUrl
            ? getDisplayNameFromUrl(
                event.meetingUrl,
                event.browserName || normalizedPlatform,
              )
            : displayName;
          const enrichedNormalizedUrl = event.meetingUrl
            ? normalizeUrl(event.meetingUrl)
            : undefined;

          const meetingEvent: MeetingEvent = {
            type: event.meetingUrl ? "browser" : "audio",
            platform,
            displayName: enrichedDisplayName,
            originalUrl: event.meetingUrl,
            normalizedUrl: enrichedNormalizedUrl,
            browserName: event.browserName,
            processId: event.processID,
            processName: event.processName,
            parentProcessName: event.parentProcessName,
            parentProcessId: event.parentProcessID,
            timestamp: Date.now(),
          };

          if (shouldDispatchEvents) {
            // Skip coordination dance — call handleMeetingEvent directly
            handleMeetingEvent(meetingEvent);
          }

          processedAudioPids.current.add(event.processID);
          onMeetingDetected?.(meetingEvent);
          return;
        }

        // Legacy mode: use coordination dance with browser events
        const meetingEvent: MeetingEvent = {
          type: "audio",
          platform: normalizedPlatform,
          displayName,
          processId: event.processID,
          processName: event.processName,
          parentProcessName: event.parentProcessName,
          parentProcessId: event.parentProcessID,
          timestamp: Date.now(),
        };

        if (shouldDispatchEvents) {
          handleRawAudioEvent(meetingEvent);
        }

        processedAudioPids.current.add(event.processID);
        onMeetingDetected?.(meetingEvent);
      } else if (event.type === "mic_stopped") {
        processedAudioPids.current.delete(event.processID);
        // Clear parent process tracking immediately.
        // Brief mic drops are already absorbed by the mic_stopped debounce
        // in useAudioMonitor (MIC_STOP_CONFIRMATION_MS), so by the time
        // mic_stopped dispatches here, the mic is truly off.
        const stoppedParentKey = (
          event.parentProcessName || event.processName
        ).toLowerCase();
        const existingTimer = cleanupTimers.get(stoppedParentKey);
        if (existingTimer) clearTimeout(existingTimer);
        activeParentProcesses.current.delete(stoppedParentKey);
        cleanupTimers.delete(stoppedParentKey);
        if (event.processID) {
          markLocalMeetingEndedByProcess(event.processID);
        }
      }
    });

    return () => {
      unsubscribe?.();
      cleanupTimers.forEach((t) => clearTimeout(t));
      cleanupTimers.clear();
    };
  }, [
    audioMonitor,
    handleRawAudioEvent,
    handleMeetingEvent,
    onMeetingDetected,
    shouldDispatchEvents,
    markLocalMeetingEndedByProcess,
  ]);
}

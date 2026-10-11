import { useCallback, useEffect, useRef, useState } from "react";
import { isDesktop } from "@/utils/device";
import { useAuth } from "@/features/auth";
import { registerCleanupCallback } from "@/features/desktop-meeting-detection/meetingStateCleanup";
import {
  DESKTOP_FIRST_TIME_DEMO_FLAG_KEY,
  getLocalUserFlag,
} from "@/features/user-flags";
import type {
  AudioEvent,
  AudioEventHandler,
  UseAudioMonitorReturn,
} from "@/features/desktop-meeting-detection/audio-monitor/types";
import { MIC_START_CONFIRMATION_MS } from "../constants";

// Wait 15 seconds after mic_started before confirming it's a real event,
// long enough to filter out waiting-room mic activations.
export { MIC_START_CONFIRMATION_MS } from "../constants";

// Wait 3 seconds after mic_stopped before confirming the mic is truly off
// (Teams briefly drops and re-acquires mic during audio renegotiation)
const MIC_STOP_CONFIRMATION_MS = 3000;
const AUTO_START_DELAY_MS = 2000;

/**
 * Hook to manage audio monitoring functionality.
 * Only works on desktop and when user is authenticated.
 * Handles idempotency to prevent multiple start/stop calls.
 */
export const useAudioMonitor = (): UseAudioMonitorReturn => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoStartEnabled, setAutoStartEnabled] = useState(true);
  const startingRef = useRef(false);
  const eventHandlers = useRef<Set<AudioEventHandler>>(new Set());
  // Track pending mic_started events waiting for confirmation
  const pendingMicStarts = useRef<
    Map<number, { event: AudioEvent; timer: ReturnType<typeof setTimeout> }>
  >(new Map());
  // Track pending mic_stopped events waiting for confirmation
  const pendingMicStops = useRef<
    Map<number, { event: AudioEvent; timer: ReturnType<typeof setTimeout> }>
  >(new Map());

  // Register for periodic cleanup
  useEffect(() => {
    return registerCleanupCallback(() => {
      pendingMicStarts.current.forEach(({ timer }) => clearTimeout(timer));
      pendingMicStarts.current.clear();
      pendingMicStops.current.forEach(({ timer }) => clearTimeout(timer));
      pendingMicStops.current.clear();
    });
  }, []);

  // Check if audio monitor is available
  const isAvailable = isDesktop && !!window.electron?.audioMonitor && !!user;

  // Sync initial state from electron
  useEffect(() => {
    if (!isAvailable || !window.electron?.audioMonitor) return;

    const checkInitialState = async () => {
      try {
        const active = await window.electron!.audioMonitor.isActive();
        setIsActive(active);
      } catch (err) {
        console.error("[AUDIO MONITOR] Failed to check initial state:", err);
      }
    };

    checkInitialState();
  }, [isAvailable]);

  // Helper to dispatch event to all handlers
  const dispatchEvent = useCallback((event: AudioEvent) => {
    eventHandlers.current.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error("[AUDIO MONITOR] Error in event handler:", err);
      }
    });
  }, []);

  // Setup audio event forwarding with debounce for mic_started events
  useEffect(() => {
    if (!isAvailable || !window.electron?.audioMonitor) return;

    const starts = pendingMicStarts.current;
    const stops = pendingMicStops.current;

    const cleanup = window.electron.audioMonitor.onAudioEvent(
      (event: AudioEvent) => {
        const pid = event.processID;

        if (event.type === "mic_started") {
          // Check if there's a pending mic_stopped for this PID (brief drop & re-acquire)
          const pendingStop = stops.get(pid);
          if (pendingStop) {
            // Mic came back while stop was pending — cancel the pending stop
            clearTimeout(pendingStop.timer);
            stops.delete(pid);
            // Don't dispatch either event — the meeting continues uninterrupted
            return;
          }

          // Check if we already have a pending event for this PID
          const existing = starts.get(pid);
          if (existing) {
            // Clear the old timer and update with new event
            clearTimeout(existing.timer);
          }

          // Create a new pending event with confirmation timer
          const timer = setTimeout(() => {
            // Timer fired - mic has been active for 3 seconds, confirm the event
            starts.delete(pid);
            dispatchEvent(event);
          }, MIC_START_CONFIRMATION_MS);

          starts.set(pid, { event, timer });
        } else if (event.type === "mic_stopped") {
          // Check if there's a pending mic_started for this PID
          const pendingStart = starts.get(pid);
          if (pendingStart) {
            // Cancel the pending mic_started - it was a false positive
            clearTimeout(pendingStart.timer);
            starts.delete(pid);
            // Don't dispatch the mic_stopped since we never dispatched mic_started
          } else {
            // Debounce mic_stopped: wait before confirming the mic is truly off
            // (Teams briefly drops mic during audio renegotiation)
            const existingStop = stops.get(pid);
            if (existingStop) {
              clearTimeout(existingStop.timer);
            }

            const timer = setTimeout(() => {
              stops.delete(pid);
              dispatchEvent(event);
            }, MIC_STOP_CONFIRMATION_MS);

            stops.set(pid, { event, timer });
          }
        } else {
          // Other event types pass through immediately
          dispatchEvent(event);
        }
      },
    );

    // Cleanup pending timers on unmount
    return () => {
      cleanup?.();
      starts.forEach(({ timer }) => clearTimeout(timer));
      starts.clear();
      stops.forEach(({ timer }) => clearTimeout(timer));
      stops.clear();
    };
  }, [isAvailable, dispatchEvent]);

  const start = useCallback(async () => {
    if (!isAvailable) {
      setError("Audio monitor not available (requires desktop + auth)");
      return;
    }

    // Prevent concurrent start calls
    if (startingRef.current || isActive) {
      return;
    }

    startingRef.current = true;
    setIsStarting(true);
    setError(null);
    // Re-enable auto-start when user explicitly starts
    setAutoStartEnabled(true);

    try {
      const success = await window.electron!.audioMonitor.start();
      if (success) {
        setIsActive(true);
      } else {
        setError("Failed to start audio monitor");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Audio monitor start failed: ${message}`);
      console.error("[AUDIO MONITOR] Start failed:", err);
    } finally {
      setIsStarting(false);
      startingRef.current = false;
    }
  }, [isAvailable, isActive]);

  // Auto-start when conditions are met and auto-start is enabled
  // Delay briefly to allow calendar events to load first
  // Only start if user is logged in and desktop onboarding is complete
  const onboardingComplete = getLocalUserFlag(DESKTOP_FIRST_TIME_DEMO_FLAG_KEY);
  useEffect(() => {
    if (
      autoStartEnabled &&
      onboardingComplete &&
      !isActive &&
      !isStarting &&
      !error &&
      user
    ) {
      const timer = setTimeout(() => {
        start();
      }, AUTO_START_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [
    autoStartEnabled,
    onboardingComplete,
    isActive,
    isStarting,
    error,
    user,
    start,
  ]);

  const stop = useCallback(async () => {
    if (!isAvailable) {
      return;
    }

    // Don't stop if we're currently starting
    if (startingRef.current) {
      return;
    }

    // Disable auto-start when user explicitly stops
    setAutoStartEnabled(false);

    try {
      const success = await window.electron!.audioMonitor.stop();
      if (success) {
        setIsActive(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Audio monitor stop failed: ${message}`);
      console.error("[AUDIO MONITOR] Stop failed:", err);
    }
  }, [isAvailable]);

  const onAudioEvent = useCallback((handler: AudioEventHandler) => {
    eventHandlers.current.add(handler);

    return () => {
      eventHandlers.current.delete(handler);
    };
  }, []);

  // Auto-stop when user logs out
  useEffect(() => {
    if (!user && isActive) {
      stop();
    }
  }, [user, isActive, stop]);

  return {
    isActive,
    isStarting,
    error,
    start,
    stop,
    onAudioEvent,
  };
};

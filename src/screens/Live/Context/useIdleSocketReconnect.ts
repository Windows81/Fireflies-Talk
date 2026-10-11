import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import { Logger } from "@/logger";
import {
  MAX_IDLE_SOCKET_RECONNECTS,
  shouldReconnectIdleSocket,
  type LiveMeetingSocket,
} from "@/features/live";

const logger = new Logger("useIdleSocketReconnect");

// Inactivity threshold before forcing a reconnect (5 minutes, matching dashboard)
const INACTIVITY_THRESHOLD_MS = 300_000;
// How often to check for inactivity (1 second, matching dashboard)
const CHECK_INTERVAL_MS = 1000;
// Delay before reconnecting after disconnect (5 second, matching dashboard)
export const RECONNECT_DELAY_MS = 5000;

interface UseIdleSocketReconnectOptions {
  socket: LiveMeetingSocket | null;
  isLive: boolean;
  receivesTranscriptsOverSocket: boolean;
  lastActivityTimeRef: MutableRefObject<number>;
  idleReconnectCountRef: MutableRefObject<number>;
  clearDnsCache: () => Promise<void>;
  onReconnect?: () => void;
}

/**
 * Forces a reconnect when a live socket has delivered nothing for a while
 * (matches dashboard's useReconnectSocket).
 */
export const useIdleSocketReconnect = ({
  socket,
  isLive,
  receivesTranscriptsOverSocket,
  lastActivityTimeRef,
  idleReconnectCountRef,
  clearDnsCache,
  onReconnect,
}: UseIdleSocketReconnectOptions) => {
  const isReconnectingRef = useRef(false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !isLive) return;

    const checkReconnect = async () => {
      const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;

      const shouldReconnect = shouldReconnectIdleSocket({
        isLive,
        isReconnecting: isReconnectingRef.current,
        msSinceLastActivity: timeSinceLastActivity,
        idleThresholdMs: INACTIVITY_THRESHOLD_MS,
        idleReconnectCount: idleReconnectCountRef.current,
        capIdleReconnects: !receivesTranscriptsOverSocket,
      });
      if (!shouldReconnect) return;

      isReconnectingRef.current = true;
      idleReconnectCountRef.current += 1;

      logger.info("Socket idle, forcing reconnect", {
        timeSinceLastActivity,
        connected: socket.connected,
        attempt: idleReconnectCountRef.current,
        maxAttempts: MAX_IDLE_SOCKET_RECONNECTS,
      });

      socket.disconnect();
      await clearDnsCache();

      // Clear any existing inactivity timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(() => {
        socket.connect();
        logger.info("Socket reconnected after inactivity timeout");
        onReconnect?.();
        isReconnectingRef.current = false;
        inactivityTimeoutRef.current = null;
      }, RECONNECT_DELAY_MS);

      lastActivityTimeRef.current = Date.now();
    };

    const intervalId = setInterval(checkReconnect, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);

      // Clear any pending inactivity timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      // Reset reconnecting flag
      isReconnectingRef.current = false;
    };
  }, [
    socket,
    isLive,
    receivesTranscriptsOverSocket,
    lastActivityTimeRef,
    idleReconnectCountRef,
    clearDnsCache,
    onReconnect,
  ]);
};

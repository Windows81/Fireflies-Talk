import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { ApolloClient } from "@apollo/client";
import { Config } from "@/constants";
import type {
  GetTranscriptFfAuthQuery,
  GetTranscriptFfAuthQueryVariables,
} from "@/graphql";
import { GetTranscriptFfAuthDocument } from "@/graphql";
import { Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import {
  resolveConnectErrorAction,
  resolveTokenRetryDelayMs,
  type LiveMeetingSocket,
} from "@/features/live";
import { ASSIST_MODES, type AssistMode } from "src/features/live/types";
import {
  RECONNECT_DELAY_MS,
  useIdleSocketReconnect,
} from "./useIdleSocketReconnect";

const logger = new Logger("useLiveMeetingSocket");

interface UseLiveMeetingSocketOptions {
  apolloClient: ApolloClient<unknown>;
  meetingId: string;
  assistMode: AssistMode;
  knowledgeBases: string[];
  isLive: boolean;
  /**
   * False when transcripts reach this renderer over Electron IPC instead of the
   * socket, which makes an idle socket normal rather than a symptom.
   */
  receivesTranscriptsOverSocket: boolean;
  onReconnect?: () => void;
  /**
   * Called when realtime-ff refuses the handshake because the meeting has
   * ended while this client still treats it as live.
   */
  onMeetingEnded?: () => void;
}

interface UseLiveMeetingSocketResult {
  socket: LiveMeetingSocket | null;
  realtimeToken: string | null;
  initError: Error | null;
  setLastActivityTime: () => void;
}

/**
 * Hook that manages the live meeting socket lifecycle including:
 * - Socket creation and connection
 * - Automatic reconnection on server disconnect
 * - Inactivity-based reconnection, capped so a socket that legitimately
 *   receives nothing is not reconnected forever
 * - DNS cache clearing before reconnects
 * - Connection error logging
 */
export const useLiveMeetingSocket = ({
  apolloClient,
  meetingId,
  assistMode,
  knowledgeBases,
  isLive,
  receivesTranscriptsOverSocket,
  onReconnect,
  onMeetingEnded,
}: UseLiveMeetingSocketOptions): UseLiveMeetingSocketResult => {
  const [socket, setSocket] = useState<LiveMeetingSocket | null>(null);
  const [realtimeToken, setRealtimeToken] = useState<string | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);
  // Bumped when the server rejects the token; re-runs the connection effect so
  // it mints a fresh token and reconnects with it.
  const [tokenGeneration, setTokenGeneration] = useState(0);
  const lastTokenRefreshAtRef = useRef(0);
  const tokenFailuresRef = useRef({ meetingId: "", count: 0 });
  const tokenRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for socket management
  const socketRef = useRef<LiveMeetingSocket | null>(null);
  const initRunIdRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track isLive state for disconnect handler (it's created at socket init time
  // but needs current isLive value when disconnect occurs)
  const isLiveRef = useRef(isLive);
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  const onMeetingEndedRef = useRef(onMeetingEnded);
  useEffect(() => {
    onMeetingEndedRef.current = onMeetingEnded;
  }, [onMeetingEnded]);

  // Refs for inactivity tracking
  const lastActivityTimeRef = useRef(Date.now());
  const idleReconnectCountRef = useRef(0);

  // Connecting restarts the idle clock but is not traffic, so it must not
  // refund the idle-reconnect budget — otherwise a socket that reconnects and
  // then receives nothing reconnects again every threshold, forever.
  const markSocketConnected = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
  }, []);

  // Inbound data proves the socket is delivering, so the budget is restored.
  const setLastActivityTime = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    idleReconnectCountRef.current = 0;
  }, []);

  // Clear Electron's DNS cache before reconnecting
  const clearDnsCache = useCallback(async () => {
    if (!isDesktop) return;

    try {
      await window.electron?.clearHostResolverCache?.();
      logger.info("Cleared host resolver cache before reconnect");
    } catch (error) {
      logger.warn("Failed to clear host resolver cache", { error });
    }
  }, []);

  // Socket creation and connection effect
  useEffect(() => {
    const runId = ++initRunIdRef.current;
    let isActive = true;

    const cleanupSocket = (sock?: LiveMeetingSocket | null) => {
      if (!sock) return;
      try {
        sock.removeAllListeners();
        sock.disconnect();
      } catch (error) {
        logger.warn("Failed to disconnect socket during cleanup", { error });
      }
    };

    // Always tear down any previous socket immediately
    cleanupSocket(socketRef.current);
    socketRef.current = null;
    setSocket(null);
    setRealtimeToken(null);
    setInitError(null);

    if (!meetingId) return;

    // A token request that fails (API blip while the old token was already
    // rejected) would otherwise leave the session with neither a socket nor a
    // pending reconnect, so re-request it with a bounded backoff.
    const scheduleTokenRetry = () => {
      if (tokenFailuresRef.current.meetingId !== meetingId) {
        tokenFailuresRef.current = { meetingId, count: 0 };
      }
      const failedAttempts = ++tokenFailuresRef.current.count;
      const delayMs = resolveTokenRetryDelayMs(failedAttempts);
      if (delayMs === null) {
        logger.warn("Giving up on realtime token after repeated failures", {
          meetingId,
          failedAttempts,
        });
        return;
      }

      logger.info("Retrying realtime token request", { meetingId, delayMs });
      tokenRetryTimeoutRef.current = setTimeout(() => {
        tokenRetryTimeoutRef.current = null;
        setTokenGeneration((generation) => generation + 1);
      }, delayMs);
    };

    const fetchAuthToken = async () => {
      const res = await apolloClient.query<
        GetTranscriptFfAuthQuery,
        GetTranscriptFfAuthQueryVariables
      >({
        query: GetTranscriptFfAuthDocument,
        variables: {
          meetingId,
          source: isDesktop ? "desktop-ff" : "mobile-ff",
        },
        fetchPolicy: "network-only",
      });

      if (!isActive || runId !== initRunIdRef.current) return null;

      if (res.error) {
        logger.error("Failed to get auth token for realtime transcript", {
          error: res.error,
          meetingId,
        });
        setInitError(res.error);
        scheduleTokenRetry();
        return null;
      }

      const authToken = res.data.getTranscriptFFAuth;
      if (!authToken) {
        const error = new Error(
          "Cannot query authentication token for realtime transcript",
        );
        logger.error("No auth token returned for realtime transcript", {
          meetingId,
        });
        setInitError(error);
        scheduleTokenRetry();
        return null;
      }

      return authToken;
    };

    const connectWithToken = async (token: string) => {
      if (!isActive || runId !== initRunIdRef.current) return;

      logger.info("Got realtime transcript auth token, connecting to socket");

      const nextSocket = io(`${Config.REALTIME_FF_HOST_WS}/transcription`, {
        auth: { token },
        query: {
          source: isDesktop ? "desktop-ff" : "mobile-ff",
          sample_rate: 48000,
          assistMode,
          ...(Number(knowledgeBases?.length) > 0 &&
          assistMode !== ASSIST_MODES.GENERAL
            ? { knowledgeBases }
            : {}),
        },
        autoConnect: false,
        reconnection: true,
        transports: ["websocket", "polling"],
      });

      // Connection event handlers
      nextSocket.on("connect", () => {
        logger.info("Connected to realtime transcript socket");
        markSocketConnected();
      });

      nextSocket.on(
        "disconnect",
        async (reason: string, description?: unknown) => {
          const willAutoReconnect = ![
            "io server disconnect",
            "io client disconnect",
          ].includes(reason);

          logger.info("Disconnected from realtime transcript socket", {
            reason,
            description,
            willAutoReconnect,
            isLive: isLiveRef.current,
          });

          // When server forcefully disconnects us, socket.io won't auto-reconnect.
          // Only attempt reconnect if the meeting is still live - once the meeting
          // ends (after onInstantSummaryBroadcast), there's no need to reconnect.
          if (reason === "io server disconnect" && isLiveRef.current) {
            logger.info(
              "Server disconnected us, attempting immediate reconnect",
            );

            await clearDnsCache();

            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              // Double-check isLive hasn't changed during the delay
              if (nextSocket && !nextSocket.connected && isLiveRef.current) {
                logger.info("Reconnecting after server disconnect");
                nextSocket.connect();
              }
              reconnectTimeoutRef.current = null;
            }, RECONNECT_DELAY_MS);
          }
        },
      );

      // socket.io's built-in reconnection retries transport errors; handshake
      // rejections from realtime-ff are final until this client acts on them.
      nextSocket.on("connect_error", (error) => {
        const action = resolveConnectErrorAction({
          message: error.message,
          isLive: isLiveRef.current,
          msSinceLastTokenRefresh: Date.now() - lastTokenRefreshAtRef.current,
        });
        logger.warn("Realtime socket connect error", { error, action });

        if (action === "end-session") {
          onMeetingEndedRef.current?.();
          return;
        }

        if (action === "refresh-token") {
          lastTokenRefreshAtRef.current = Date.now();
          setTokenGeneration((generation) => generation + 1);
        }
      });

      nextSocket.io.on("reconnect_error", (error) => {
        logger.warn("Realtime socket reconnect error", { error });
      });

      nextSocket.io.on("reconnect_attempt", (attempt) => {
        logger.info("Realtime socket reconnection attempt", { attempt });
      });

      nextSocket.io.on("reconnect", (attempt) => {
        logger.info("Realtime socket reconnected", { attempt });
        markSocketConnected();
      });

      nextSocket.io.on("reconnect_failed", () => {
        logger.error("Realtime socket reconnection failed permanently");
      });

      if (!isActive || runId !== initRunIdRef.current) {
        cleanupSocket(nextSocket);
        return;
      }

      socketRef.current = nextSocket;
      setSocket(nextSocket);
      nextSocket.connect();
    };

    const start = async () => {
      logger.info("Initializing realtime transcript socket", { meetingId });

      const authToken = await fetchAuthToken();
      if (!authToken || !isActive || runId !== initRunIdRef.current) return;

      tokenFailuresRef.current = { meetingId, count: 0 };
      setRealtimeToken(authToken);
      await connectWithToken(authToken);
    };

    void start().catch((error) => {
      if (!isActive || runId !== initRunIdRef.current) return;
      logger.error("Failed to initialize realtime transcript socket", {
        error,
      });
      setInitError(error instanceof Error ? error : new Error(String(error)));
      scheduleTokenRetry();
    });

    return () => {
      isActive = false;
      cleanupSocket(socketRef.current);
      socketRef.current = null;

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (tokenRetryTimeoutRef.current) {
        clearTimeout(tokenRetryTimeoutRef.current);
        tokenRetryTimeoutRef.current = null;
      }
    };
  }, [
    apolloClient,
    assistMode,
    clearDnsCache,
    knowledgeBases,
    meetingId,
    markSocketConnected,
    tokenGeneration,
  ]);

  useIdleSocketReconnect({
    socket,
    isLive,
    receivesTranscriptsOverSocket,
    lastActivityTimeRef,
    idleReconnectCountRef,
    clearDnsCache,
    onReconnect,
  });

  return {
    socket,
    realtimeToken,
    initError,
    setLastActivityTime,
  };
};

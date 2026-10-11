import { Config } from "@/constants";
import { authApi, useAuth } from "@/features/auth";
import { Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import { getRequestMetadataHeaders } from "@/utils/request";
import { fetch as expoFetch } from "expo/fetch";
import { useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";

const logger = new Logger("live-meeting-events");

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const SSE_NOTIFICATION_EVENT = "notification";

const NOTIFICATION_TYPES = {
  FRED_JOINED_MEETING: "FRED_JOINED_MEETING",
} as const;

type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export type RealtimeNotificationPayload = {
  type: NotificationType | string;
  data: unknown;
  timestamp?: number;
};

export type FredJoinedMeetingData = {
  meetingId: string;
  title?: string | null;
  organizerEmail?: string | null;
  fredJoinedMeetingAt?: string | null;
  allEmails?: string[] | null;
};

export type UseRealtimeNotificationsOptions = {
  enabled?: boolean;
  onNotification?: (payload: RealtimeNotificationPayload) => void;
  onMeetingStarted?: (
    data: FredJoinedMeetingData,
    payload: RealtimeNotificationPayload,
  ) => void;
};

type Listener = (payload: RealtimeNotificationPayload) => void;

type SubscriberMeta = {
  enabled: boolean;
  authKey: string | null;
};

type ParsedSseEvent = {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
};

type ParsedSseEnvelope = {
  type?: string;
  data?: string;
  id?: string;
  retry?: number;
};

const subscribers = new Map<Listener, SubscriberMeta>();

const sseState = {
  active: false,
  connecting: false,
  retryCount: 0,
  reconnectTimeout: null as ReturnType<typeof setTimeout> | null,
  abortController: null as AbortController | null,
  authKey: null as string | null,
};

const getSseUrl = () => {
  const base = Config.REALTIME_FF_HOST_WS;
  const normalized = `https://${base.replace(/^wss?:\/\//, "")}`;
  return new URL("/notifications/sse", normalized).toString();
};

const SSE_URL = getSseUrl();

const safeJsonParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const hasMeetingId = (data: unknown): data is { meetingId: string } => {
  if (!data || typeof data !== "object") return false;
  const meetingId = (data as { meetingId?: unknown }).meetingId;
  return typeof meetingId === "string" && meetingId.length > 0;
};

const notifySubscribers = (payload: RealtimeNotificationPayload) => {
  subscribers.forEach((_meta, listener) => {
    try {
      listener(payload);
    } catch (error) {
      logger.error("Live meeting event handler failed", { error });
    }
  });
};

const normalizeSseEvent = (event: ParsedSseEvent) => {
  if (event.event) {
    return { eventType: event.event, data: event.data };
  }

  const envelope = safeJsonParse<ParsedSseEnvelope>(event.data);
  if (envelope?.type && typeof envelope.data === "string") {
    return { eventType: envelope.type, data: envelope.data };
  }

  return { eventType: undefined, data: event.data };
};

const getMeetingId = (payload: RealtimeNotificationPayload) => {
  if (!payload?.data || typeof payload.data !== "object") return null;
  const meetingId = (payload.data as { meetingId?: unknown }).meetingId;
  return typeof meetingId === "string" ? meetingId : null;
};

const handleSseEvent = (event: ParsedSseEvent) => {
  const { eventType, data } = normalizeSseEvent(event);
  if (eventType !== SSE_NOTIFICATION_EVENT || !data) return;
  const payload = safeJsonParse<RealtimeNotificationPayload>(data);
  if (!payload) {
    logger.warn("Failed to parse live meeting notification", {
      data,
    });
    return;
  }
  if (payload.type === NOTIFICATION_TYPES.FRED_JOINED_MEETING) {
    logger.info("Live meeting SSE notification received", {
      eventType: payload.type,
      meetingId: getMeetingId(payload),
    });
  }
  notifySubscribers(payload);
};

const scheduleReconnect = () => {
  if (!sseState.active || sseState.reconnectTimeout) return;
  const delay = Math.min(
    RECONNECT_MAX_MS,
    RECONNECT_BASE_MS * Math.pow(2, sseState.retryCount),
  );
  sseState.retryCount += 1;
  sseState.reconnectTimeout = setTimeout(() => {
    sseState.reconnectTimeout = null;
    void connect();
  }, delay);
};

const startConnection = () => {
  if (sseState.active) return;
  sseState.active = true;
  sseState.retryCount = 0;
  void connect();
};

const stopConnection = () => {
  sseState.active = false;
  sseState.connecting = false;
  sseState.retryCount = 0;
  sseState.authKey = null;
  if (sseState.reconnectTimeout) {
    clearTimeout(sseState.reconnectTimeout);
    sseState.reconnectTimeout = null;
  }
  if (sseState.abortController) {
    sseState.abortController.abort();
    sseState.abortController = null;
  }
};

const recomputeConnection = () => {
  let desiredAuthKey: string | null = null;
  let shouldConnect = false;

  subscribers.forEach((meta) => {
    if (meta.enabled && meta.authKey) {
      shouldConnect = true;
      if (!desiredAuthKey) {
        desiredAuthKey = meta.authKey;
      }
    }
  });

  if (!shouldConnect || !desiredAuthKey) {
    stopConnection();
    return;
  }

  if (sseState.authKey !== desiredAuthKey) {
    stopConnection();
    sseState.authKey = desiredAuthKey;
  }

  if (!sseState.active) {
    startConnection();
  }
};

const subscribeToRealtimeNotificationEvents = (
  listener: Listener,
  meta: SubscriberMeta,
) => {
  subscribers.set(listener, meta);
  recomputeConnection();
  return () => {
    subscribers.delete(listener);
    recomputeConnection();
  };
};

const updateRealtimeNotificationEventsSubscriber = (
  listener: Listener,
  meta: SubscriberMeta,
) => {
  if (!subscribers.has(listener)) return;
  subscribers.set(listener, meta);
  recomputeConnection();
};

const readSseStream = async (
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ParsedSseEvent) => void,
  signal: AbortSignal,
) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let currentEvent: ParsedSseEvent = { data: "" };

  const flushEvent = () => {
    if (
      currentEvent.data ||
      currentEvent.event ||
      currentEvent.id ||
      currentEvent.retry !== undefined
    ) {
      onEvent(currentEvent);
    }
    currentEvent = { data: "" };
  };

  const processLine = (line: string) => {
    if (line === "") {
      flushEvent();
      return;
    }
    if (line.startsWith(":")) {
      return;
    }
    const colonIndex = line.indexOf(":");
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    let value = colonIndex === -1 ? "" : line.slice(colonIndex + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }
    switch (field) {
      case "event":
        currentEvent.event = value;
        break;
      case "data":
        currentEvent.data = currentEvent.data
          ? `${currentEvent.data}\n${value}`
          : value;
        break;
      case "id":
        currentEvent.id = value;
        break;
      case "retry": {
        const retry = Number(value);
        if (!Number.isNaN(retry)) {
          currentEvent.retry = retry;
        }
        break;
      }
      default:
        break;
    }
  };

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value, { stream: true });
      buffer += chunkText;
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        let line = buffer.slice(0, newlineIndex);
        if (line.endsWith("\r")) {
          line = line.slice(0, -1);
        }
        buffer = buffer.slice(newlineIndex + 1);
        processLine(line);
        newlineIndex = buffer.indexOf("\n");
      }
    }

    if (buffer.length > 0) {
      const lines = buffer.split(/\r?\n/);
      for (const line of lines) {
        processLine(line);
      }
    }

    flushEvent();
  } finally {
    reader.releaseLock();
  }
};

const connect = async () => {
  if (!sseState.active || sseState.connecting) return;
  sseState.connecting = true;
  const abortController = new AbortController();
  sseState.abortController = abortController;

  try {
    const sseFetch = Platform.OS === "web" ? fetch.bind(globalThis) : expoFetch;
    const response = await sseFetch(SSE_URL, {
      headers: {
        ...getRequestMetadataHeaders(),
        ...(await authApi.getOrRefreshAuthHeaders()),
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      signal: abortController.signal,
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(
        `Live meeting SSE connection failed (${response.status})`,
      );
    }

    if (!response.body) {
      throw new Error("Live meeting SSE response has no body");
    }

    sseState.retryCount = 0;
    logger.info("Connected to live meeting SSE");

    await readSseStream(response.body, handleSseEvent, abortController.signal);
    logger.warn("Live meeting SSE stream closed");
  } catch {
    // Network errors are expected during reconnection attempts
  } finally {
    sseState.connecting = false;
  }

  if (sseState.active && !abortController.signal.aborted) {
    scheduleReconnect();
  }
};

export const useRealtimeNotifications = (
  options?: UseRealtimeNotificationsOptions,
) => {
  const { user } = useAuth();
  const enabled =
    Boolean(options?.enabled ?? true) && isDesktop && Boolean(user);

  const onNotificationRef = useRef(options?.onNotification);
  const onMeetingStartedRef = useRef(options?.onMeetingStarted);

  useEffect(() => {
    onNotificationRef.current = options?.onNotification;
  }, [options?.onNotification]);

  useEffect(() => {
    onMeetingStartedRef.current = options?.onMeetingStarted;
  }, [options?.onMeetingStarted]);

  const listener = useMemo<Listener>(
    () => (payload) => {
      onNotificationRef.current?.(payload);

      if (
        payload.type === NOTIFICATION_TYPES.FRED_JOINED_MEETING &&
        hasMeetingId(payload.data)
      ) {
        onMeetingStartedRef.current?.(
          payload.data as FredJoinedMeetingData,
          payload,
        );
      }
    },
    [],
  );

  const listenerRef = useRef<Listener | null>(null);

  useEffect(() => {
    listenerRef.current = listener;
    const unsubscribe = subscribeToRealtimeNotificationEvents(listener, {
      enabled,
      authKey: user?.email ?? null,
    });

    return () => {
      listenerRef.current = null;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listenerRef.current) return;
    updateRealtimeNotificationEventsSubscriber(listenerRef.current, {
      enabled,
      authKey: user?.email ?? null,
    });
  }, [enabled, user?.email]);
};

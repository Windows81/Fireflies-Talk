import { Logger } from "@/logger";
import { useMeetingDetectionStore } from "@/features/desktop-meeting-detection/store";
import { reportConsentNotice } from "@/features/recording-consent";
import type {
  BrowserName,
  ChatInjectionResult,
  GoogleMeetBrowserLookup,
} from "electron/src/types";
import { MACOS_PROCESS_TO_BROWSER } from "electron/src/types";
import {
  ClientConsentChannel,
  ClientConsentOutcome,
} from "@firefliesai/mobile-ff.graphql-client";
import { resolveBrowserConsentTarget } from "./consent-browser-target";
import { useRecorder } from "./record.store";
import type { RecordingSource } from "./types";
import {
  chatState,
  clearRetryTimer,
  DEFAULT_CONSENT_MESSAGE,
  isGoogleMeetUrl,
  isRetryableError,
  markFailedIfTerminal,
  MAX_NO_MEETING_RETRIES,
  MAX_WAITING_ROOM_MS,
  NO_MEETING_RETRY_MS,
  setDelivery,
  WAITING_ROOM_RETRY_MS,
} from "./browser-meeting-chat-state";

export { DEFAULT_CONSENT_MESSAGE };
export {
  handleNotifierUnmount,
  resetChatSendState,
} from "./browser-meeting-chat-state";

const log = new Logger("BrowserMeetingChat");

export type ChatNotifierDeps = {
  consentEnabled: boolean;
};

export function trySendChatMessage(
  deps: ChatNotifierDeps,
  recordingSource?: RecordingSource,
  retryStartedAt?: number,
  noMeetingRetryCount = 0,
) {
  if (chatState.chatSentForCurrentRecording) {
    log.info("Chat already sent for current recording — skipping");
    return;
  }

  const { consentEnabled } = deps;
  log.info("trySendChatMessage called", {
    consentEnabled,
    sourceProcess: recordingSource?.processName,
    sourcePlatform: recordingSource?.platform,
    parentProcess: recordingSource?.parentProcessName,
    meetingUrl: recordingSource?.meetingUrl,
  });

  if (!consentEnabled) {
    log.info("Consent not enabled — skipping");
    return;
  }
  chatState.chatSentForCurrentRecording = true;
  setDelivery("pending");

  log.info("Dispatching chat message", {
    messageLength: DEFAULT_CONSENT_MESSAGE.length,
  });
  dispatchChatMessage(
    DEFAULT_CONSENT_MESSAGE,
    recordingSource,
    retryStartedAt,
    noMeetingRetryCount,
  );
}

/**
 * Routing priority:
 * 1. recordingSource.processName === "zoom.us" → Zoom native keyboard shortcut
 * 2. recordingSource has browser + Google Meet URL → keyboard shortcut
 * 3. localMeetings has browser entry with Google Meet URL → keyboard shortcut
 * 4. localMeetings has native Zoom entry actively recording → Zoom keyboard shortcut
 * 5. Browser listener finds the Google Meet meeting → keyboard shortcut
 * 6. Nothing found → retry up to 10x every 2s
 */
function dispatchChatMessage(
  message: string,
  recordingSource: RecordingSource | undefined,
  retryStartedAt: number | undefined,
  noMeetingRetryCount: number,
) {
  const { localMeetings } = useMeetingDetectionStore.getState();

  log.info("localMeetings snapshot", {
    count: localMeetings.length,
    meetings: localMeetings.map((m) => ({
      status: m.status,
      platform: m.event.platform,
      browserName: m.event.browserName,
      hasUrl: !!m.event.originalUrl,
    })),
  });

  // Resolve browser from parent process early so all routes can use it.
  const sourceBrowser = recordingSource?.parentProcessName
    ? MACOS_PROCESS_TO_BROWSER[recordingSource.parentProcessName]
    : undefined;

  // 1. Explicit Zoom native (only when NOT running inside a browser)
  if (
    !sourceBrowser &&
    (recordingSource?.processName === "zoom.us" ||
      recordingSource?.platform === "zoom")
  ) {
    log.info("Route #1: Explicit Zoom native", {
      processName: recordingSource?.processName,
      platform: recordingSource?.platform,
    });
    void sendZoomNative(message, retryStartedAt).then(markFailedIfTerminal);
    return;
  }

  // 2. Explicit browser + exact Google Meet URL

  if (
    sourceBrowser &&
    recordingSource?.meetingUrl &&
    isGoogleMeetUrl(recordingSource.meetingUrl)
  ) {
    log.info("Route #2: Explicit browser + Google Meet URL", {
      sourceBrowser,
      meetingUrl: recordingSource.meetingUrl,
    });
    void sendBrowserChat(sourceBrowser, message, retryStartedAt).then(
      markFailedIfTerminal,
    );
    return;
  }

  // 3. localMeetings browser entry with Google Meet URL
  const browserWithUrl = localMeetings.find(
    (m) =>
      (m.status === "recording" || m.status === "detected") &&
      m.event.originalUrl &&
      m.event.browserName &&
      isGoogleMeetUrl(m.event.originalUrl),
  );
  if (browserWithUrl) {
    log.info("Route #3: localMeetings browser with Google Meet URL", {
      browser: browserWithUrl.event.browserName,
      url: browserWithUrl.event.originalUrl,
      status: browserWithUrl.status,
    });
    void sendBrowserChat(
      browserWithUrl.event.browserName as BrowserName,
      message,
      retryStartedAt,
    ).then(markFailedIfTerminal);
    return;
  }

  // 4. localMeetings native Zoom actively recording
  const activeZoom = localMeetings.find(
    (m) =>
      m.event.platform === "zoom" &&
      !m.event.browserName &&
      (m.status === "recording" || m.status === "detected"),
  );
  if (activeZoom && !sourceBrowser && recordingSource?.platform !== "gmeet") {
    log.info("Route #4: localMeetings native Zoom actively recording");
    void sendZoomNative(message, retryStartedAt).then(markFailedIfTerminal);
    return;
  }

  // 5. No URL anywhere yet — ask the browser listener where the meeting is.
  const detectedBrowser = localMeetings.find(
    (m) =>
      (m.status === "recording" || m.status === "detected") &&
      m.event.platform !== "zoom" &&
      m.event.browserName &&
      !m.event.originalUrl,
  )?.event.browserName as BrowserName | undefined;

  log.info("Route #5: Best-effort fallback", {
    detectedBrowser,
    sourceBrowser,
    noMeetingRetryCount,
  });
  void bestEffortSend(
    message,
    { detectedBrowser, micBrowser: sourceBrowser },
    retryStartedAt,
    noMeetingRetryCount,
  );
}

/**
 * Which browser holds a Google Meet meeting, per the browser listener.
 * A lookup that cannot run reports itself unreadable rather than "no meeting",
 * so an old preload or a thrown AppleScript keeps best-effort delivery alive.
 */
async function lookupGoogleMeetBrowser(): Promise<GoogleMeetBrowserLookup> {
  const findBrowser = window.electron?.browserMeetings?.findGoogleMeetBrowser;
  if (!findBrowser) {
    log.warn("findGoogleMeetBrowser IPC bridge not available");
    return { browser: null, readable: false };
  }
  try {
    return await findBrowser();
  } catch (error) {
    log.warn("Google Meet browser lookup failed", { error: String(error) });
    return { browser: null, readable: false };
  }
}

async function bestEffortSend(
  message: string,
  candidates: { detectedBrowser?: BrowserName; micBrowser?: BrowserName },
  retryStartedAt: number | undefined,
  noMeetingRetryCount: number,
) {
  const session = chatState.sessionId;

  const target = resolveBrowserConsentTarget({
    lookup: await lookupGoogleMeetBrowser(),
    ...candidates,
  });
  if (session !== chatState.sessionId) return;
  log.info("Best-effort: resolved browser target", target);

  // Without a target, sending would mean pulling a browser to the front and
  // typing into it to discover there was no meeting. Wait for the retry instead.
  if (target.browser) {
    const meetResult = await sendBrowserChat(
      target.browser,
      message,
      retryStartedAt,
    );
    if (session !== chatState.sessionId) return;
    if (meetResult?.success) return;
    if (isRetryableError(meetResult?.error)) return;
  }

  // Zoom fallback on first attempt only
  const currentSource = useRecorder.getState().context?.recordingSource;
  if (currentSource?.platform !== "gmeet" && noMeetingRetryCount === 0) {
    const zoomResult = await sendZoomNative(message, retryStartedAt);
    if (session !== chatState.sessionId) return;
    if (zoomResult?.success) return;
    if (isRetryableError(zoomResult?.error)) return;
  }

  if (chatState.messageDelivered) return;

  // Retry cadence
  if (noMeetingRetryCount < MAX_NO_MEETING_RETRIES) {
    log.info("No meeting found — retrying", {
      attempt: noMeetingRetryCount + 1,
    });
    clearRetryTimer();
    const session = chatState.sessionId;
    chatState.retryTimer = setTimeout(() => {
      if (session !== chatState.sessionId) return;
      if (useRecorder.getState().status.state !== "recording") return;
      dispatchChatMessage(
        message,
        useRecorder.getState().context?.recordingSource,
        retryStartedAt,
        noMeetingRetryCount + 1,
      );
    }, NO_MEETING_RETRY_MS);
    return;
  }

  log.warn("No active meeting found after retries");
  setDelivery("failed");
}

function markDelivered() {
  chatState.messageDelivered = true;
  clearRetryTimer();
  setDelivery("delivered");
  const meetingId = useRecorder.getState().context?.meetingId;
  if (meetingId) {
    void reportConsentNotice({
      meetingId,
      channel: ClientConsentChannel.Chat,
      outcome: ClientConsentOutcome.Sent,
      noticeBody: DEFAULT_CONSENT_MESSAGE,
    });
  }
}

function sendZoomNative(
  message: string,
  retryStartedAt?: number,
): Promise<ChatInjectionResult | null> {
  if (chatState.messageDelivered) {
    log.info("Zoom: message already delivered — skipping");
    return Promise.resolve(null);
  }
  const bm = window.electron?.browserMeetings;
  if (!bm?.sendZoomNativeChat) {
    log.warn("sendZoomNativeChat IPC bridge not available");
    return Promise.resolve({
      success: false,
      error: "IPC bridge not available",
    });
  }
  if (chatState.zoomNativeInFlight) {
    log.info("Zoom native chat already in flight — skipping");
    return Promise.resolve(null);
  }
  chatState.zoomNativeInFlight = true;
  const session = chatState.sessionId;
  log.info("Sending via Zoom keyboard shortcut (Cmd+Shift+H)");
  return bm
    .sendZoomNativeChat(message)
    .then((r) => {
      log.info("Zoom native chat result", r);
      if (session !== chatState.sessionId) return null;
      if (r.success) {
        markDelivered();
      } else if (isRetryableError(r.error)) {
        scheduleRetry(message, retryStartedAt);
      }
      return r;
    })
    .catch((err: unknown) => {
      log.error("Zoom native chat failed", { error: String(err) });
      if (session !== chatState.sessionId) return null;
      return { success: false, error: String(err) };
    })
    .finally(() => {
      if (session === chatState.sessionId) chatState.zoomNativeInFlight = false;
    });
}

function sendBrowserChat(
  browser: BrowserName,
  message: string,
  retryStartedAt: number | undefined,
): Promise<ChatInjectionResult | null> {
  if (chatState.messageDelivered) {
    log.info("Browser: message already delivered — skipping");
    return Promise.resolve(null);
  }
  const bm = window.electron?.browserMeetings;
  if (!bm?.sendChatMessage) {
    log.warn("sendChatMessage IPC bridge not available");
    return Promise.resolve({
      success: false,
      error: "IPC bridge not available",
    });
  }
  const session = chatState.sessionId;
  log.info("Sending via browser keyboard shortcut (Ctrl+Cmd+C)", { browser });
  return bm
    .sendChatMessage(browser, message)
    .then((r) => {
      log.info("Browser chat result", r);
      if (session !== chatState.sessionId) return null;
      if (r.success) {
        markDelivered();
      } else if (isRetryableError(r.error)) {
        scheduleRetry(message, retryStartedAt);
      }
      return r;
    })
    .catch((err: unknown) => {
      log.error("Browser chat failed", { error: String(err) });
      if (session !== chatState.sessionId) return null;
      return { success: false, error: String(err) };
    });
}

function scheduleRetry(message: string, retryStartedAt: number | undefined) {
  const startedAt = retryStartedAt ?? Date.now();
  if (Date.now() - startedAt >= MAX_WAITING_ROOM_MS) {
    log.warn("Waiting room retry timed out after 5 minutes");
    setDelivery("failed");
    return;
  }
  if (useRecorder.getState().status.state !== "recording") return;
  log.info("Still in waiting room — retrying in 5s");
  clearRetryTimer();
  const session = chatState.sessionId;
  chatState.retryTimer = setTimeout(() => {
    if (session !== chatState.sessionId) return;
    chatState.chatSentForCurrentRecording = false;
    if (useRecorder.getState().status.state !== "recording") return;
    chatState.chatSentForCurrentRecording = true;
    dispatchChatMessage(
      message,
      useRecorder.getState().context?.recordingSource,
      startedAt,
      0,
    );
  }, WAITING_ROOM_RETRY_MS);
}

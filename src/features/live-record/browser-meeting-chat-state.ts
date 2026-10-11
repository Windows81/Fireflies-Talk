import { getPlatformFromUrl } from "@/features/desktop-meeting-detection/meetingPlatforms";
import { useRecorder } from "@/features/live-record/record.store";
import type { ChatInjectionResult } from "electron/src/types";
import {
  type ConsentDeliveryStatus,
  useConsentDeliveryStore,
} from "./consent-delivery.store";

export const DEFAULT_CONSENT_MESSAGE =
  "This meeting is being transcribed by Fireflies.ai";

export const WAITING_ROOM_RETRY_MS = 5_000;
export const MAX_WAITING_ROOM_MS = 5 * 60 * 1_000;
export const NO_MEETING_RETRY_MS = 2_000;
export const MAX_NO_MEETING_RETRIES = 10;
/** Delay before dispatching consent so the Live View window can finish opening
 *  without stealing focus from the target app during activation polling. */
export const CONSENT_DISPATCH_DELAY_MS = 5_000;

/**
 * Per-recording chat-send state shared across the dispatch/routing functions.
 */
export const chatState = {
  chatSentForCurrentRecording: false,
  retryTimer: null as ReturnType<typeof setTimeout> | null,
  consentDelayTimer: null as ReturnType<typeof setTimeout> | null,
  // Guards against two concurrent Zoom sends.
  zoomNativeInFlight: false,
  // Set once any route delivers the message — prevents duplicate sends.
  messageDelivered: false,
  // Bumped on every reset so stale async callbacks discard their results.
  sessionId: 0,
};

export const setDelivery = (status: ConsentDeliveryStatus) =>
  useConsentDeliveryStore.getState().setStatus(status);

/** Errors that indicate a transient state (app not yet active, chat panel
 *  not yet open) — worth retrying via the waiting-room cadence. */
const RETRYABLE_ERRORS = new Set([
  "Failed to send chat open shortcut",
  "Failed to activate target app",
]);

export const isRetryableError = (error?: string): boolean =>
  !!error && RETRYABLE_ERRORS.has(error);

export const markFailedIfTerminal = (r: ChatInjectionResult | null) => {
  if (!r) return;
  if (chatState.messageDelivered || r.success) return;
  if (isRetryableError(r.error)) return;
  setDelivery("failed");
};

export const isGoogleMeetUrl = (url?: string | null) =>
  !!url && getPlatformFromUrl(url) === "gmeet";

export const isRecordingActive = () =>
  useRecorder.getState().status.state === "recording";

export function clearRetryTimer() {
  if (chatState.retryTimer !== null) {
    clearTimeout(chatState.retryTimer);
    chatState.retryTimer = null;
  }
}

export function clearConsentDelayTimer() {
  if (chatState.consentDelayTimer !== null) {
    clearTimeout(chatState.consentDelayTimer);
    chatState.consentDelayTimer = null;
  }
}

export function resetChatSendState() {
  chatState.chatSentForCurrentRecording = false;
  chatState.messageDelivered = false;
  chatState.zoomNativeInFlight = false;
  chatState.sessionId += 1;
  clearRetryTimer();
  clearConsentDelayTimer();
  useConsentDeliveryStore.getState().reset();
}

export function handleNotifierUnmount() {
  if (chatState.retryTimer !== null) {
    chatState.chatSentForCurrentRecording = false;
  }
  clearRetryTimer();
  clearConsentDelayTimer();
}

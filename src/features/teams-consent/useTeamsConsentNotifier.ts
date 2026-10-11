import { useDesktopConsentPolicy } from "@/features/consent-policy";
import {
  isTeamsPlatform,
  useMeetingDetectionStore,
} from "@/features/desktop-meeting-detection";
import { useConsentDeliveryStore } from "@/features/live-record/consent-delivery.store";
import { useRecorder } from "@/features/live-record/record.store";
import {
  useNotifyStealthRecordingStartedMutation,
  useRecordingPreferencesQuery,
} from "@/graphql";
import { Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import { useEffect, useRef } from "react";

const log = new Logger("TeamsConsent");

/** Poll interval for checking Teams detection while recording. */
const POLL_INTERVAL_MS = 3_000;
/** Max time to wait for a Teams meeting to be detected after recording starts. */
const MEETING_DETECT_TIMEOUT_MS = 11 * 60 * 1000;

/**
 * Server reason meaning a newer request took over this one; that request reports
 * its own outcome, so this one isn't a failure to announce consent.
 */
const SUPERSEDED_REASON = "cancelled-by-newer-request";

// Never downgrade a message the keyboard-based dispatch already delivered — the
// two can race when the recording platform isn't detected as Teams.
const reportDelivery = (status: "pending" | "delivered" | "failed") => {
  const store = useConsentDeliveryStore.getState();
  if (status !== "delivered" && store.status === "delivered") return;
  store.setStatus(status);
};

/**
 * Fires the consent mutation once per recording session when a Teams
 * meeting is detected. The server-side retry loop + userId dedup guard
 * handle timing and duplicate prevention, so the client only needs a
 * simple per-session flag.
 *
 * Uses polling instead of Zustand subscriptions to avoid subtle timing
 * issues between the recorder and detection store update cycles.
 *
 * Reports the outcome into the consent-delivery store so the live view can tell
 * whether the message actually reached the meeting.
 */
export const useTeamsConsentNotifier = () => {
  const { data } = useRecordingPreferencesQuery({
    fetchPolicy: "cache-and-network",
  });
  // The team can require the message; the account's own switch decides otherwise.
  const chatRequired = useDesktopConsentPolicy().chat;
  const consentEnabled =
    chatRequired || (data?.recordingPreferences?.teamsConsentEnabled ?? false);
  const [notify] = useNotifyStealthRecordingStartedMutation();

  const consentEnabledRef = useRef(consentEnabled);
  consentEnabledRef.current = consentEnabled;

  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const sentRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDesktop) return;

    log.info("Hook mounted");

    const sendNotification = async () => {
      // Checked here rather than at recording start: the preferences query can
      // resolve after the recording began.
      if (!consentEnabledRef.current) return;
      if (sentRef.current) return;
      sentRef.current = true;
      stopPolling();

      const corrId = globalThis.crypto.randomUUID();
      log.info("Sending consent notification", { correlationId: corrId });
      reportDelivery("pending");

      try {
        const result = await notifyRef.current({
          variables: {
            input: { source: "desktop-record", correlationId: corrId },
          },
        });

        const payload = result.data?.notifyStealthRecordingStarted;
        if (payload?.reason) {
          log.info("Consent notification result", { reason: payload.reason });
          // Any other reason means the server skipped the message (e.g. no
          // linked Teams account), so participants were never told.
          if (payload.reason !== SUPERSEDED_REASON) reportDelivery("failed");
        } else {
          log.info("Consent message sent successfully");
          reportDelivery("delivered");
        }
      } catch (error) {
        log.warn("Failed to notify stealth recording started", {
          correlationId: corrId,
          error: error instanceof Error ? error.message : String(error),
        });
        reportDelivery("failed");
      }
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const checkTeamsDetection = () => {
      const { lastTeamsDetection } = useMeetingDetectionStore.getState();
      if (lastTeamsDetection) {
        log.info("Teams meeting detected via poll", { lastTeamsDetection });
        sendNotification();
      }
    };

    const unsubRecorder = useRecorder.subscribe((state, prevState) => {
      const justStarted =
        prevState.status.state !== "recording" &&
        state.status.state === "recording";
      // Matches pause → inactive too, which is still a full stop.
      const justStopped =
        prevState.status.state !== "inactive" &&
        state.status.state === "inactive";
      const justPaused =
        prevState.status.state === "recording" &&
        state.status.state === "paused";

      if (justStopped || justPaused) {
        log.info("Recording stopped, resetting consent state");
        sentRef.current = false;
        stopPolling();
        // Not on pause: the keyboard dispatch clears this too, but it only
        // mounts on macOS.
        if (justStopped) useConsentDeliveryStore.getState().reset();
        // Clear stale Teams detection so it doesn't bleed into the
        // next recording session (e.g. a non-Teams meeting).
        useMeetingDetectionStore.setState({ lastTeamsDetection: null });
        return;
      }

      if (!justStarted) return;

      log.info("Recording started", {
        consentEnabled: consentEnabledRef.current,
      });

      sentRef.current = false;
      stopPolling();

      // Immediate check — Teams may already have been detected
      const { lastTeamsDetection } = useMeetingDetectionStore.getState();
      log.info("Initial Teams detection check", { lastTeamsDetection });

      if (lastTeamsDetection) {
        sendNotification();
        return;
      }

      // Poll the store every 3s until Teams is detected or timeout
      log.info("Starting Teams detection poll");
      pollRef.current = setInterval(checkTeamsDetection, POLL_INTERVAL_MS);
      timeoutRef.current = setTimeout(() => {
        log.info("Timed out waiting for Teams meeting detection");
        // Only Teams recordings depend on this hook to announce consent: no
        // meeting was ever found, so nothing went out and the live view should
        // fall back to the manual banner. On other platforms the keyboard
        // dispatch owns the status, so leave it untouched.
        const platform =
          useRecorder.getState().context?.recordingSource?.platform ?? "";
        if (
          consentEnabledRef.current &&
          isTeamsPlatform(platform.toLowerCase())
        ) {
          reportDelivery("failed");
        }
        stopPolling();
      }, MEETING_DETECT_TIMEOUT_MS);
    });

    return () => {
      unsubRecorder();
      stopPolling();
    };
  }, []);
};

import { useDesktopConsentPolicy } from "@/features/consent-policy";
import { useRecorder } from "@/features/live-record/record.store";
import { useRecordingPreferencesQuery } from "@/graphql";
import { Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import { useEffect, useRef } from "react";
import {
  trySendChatMessage,
  resetChatSendState,
  handleNotifierUnmount,
} from "./browser-meeting-chat-dispatch";
import {
  chatState,
  clearConsentDelayTimer,
  CONSENT_DISPATCH_DELAY_MS,
  isRecordingActive,
} from "./browser-meeting-chat-state";

const log = new Logger("BrowserConsent");

/**
 * Triggers keyboard-based consent messages for Google Meet and Zoom
 * meetings when recording starts on desktop. The Teams consent notifier
 * handles Microsoft Teams separately via the server-side Graph API.
 */
export const useBrowserConsentNotifier = () => {
  const { data: prefsData } = useRecordingPreferencesQuery({
    fetchPolicy: "cache-and-network",
  });
  // The team can require the message; the account's own switch decides otherwise.
  const chatRequired = useDesktopConsentPolicy().chat;
  const consentEnabled =
    chatRequired ||
    (prefsData?.recordingPreferences?.teamsConsentEnabled ?? false);

  const consentEnabledRef = useRef(consentEnabled);
  consentEnabledRef.current = consentEnabled;

  useEffect(() => {
    if (!isDesktop || window.electron?.platform !== "darwin") return;

    log.info("Hook mounted");

    const unsubRecorder = useRecorder.subscribe((state, prevState) => {
      // Only reset on full stop (→ inactive), NOT on pause.
      // Pausing should not clear the sent-flag because there is no
      // server-side dedup for keyboard-based consent — resetting would
      // cause a duplicate chat message on resume.
      const justStopped =
        prevState.status.state !== "inactive" &&
        state.status.state === "inactive";

      if (justStopped) {
        log.info("Recording stopped, resetting state");
        resetChatSendState();
        return;
      }

      if (state.status.state !== "recording") return;

      const justStarted =
        prevState.status.state !== "recording" &&
        state.status.state === "recording";
      const contextChanged = state.context !== prevState.context;

      if (!justStarted && !contextChanged) return;

      // Dispatch once we're recording AND context is available.
      // trySendChatMessage deduplicates via chatSentForCurrentRecording.
      const recordingSource = state.context?.recordingSource;
      if (!state.context) {
        log.info("Recording started — awaiting context update");
        return;
      }
      log.info("Recording context ready", {
        consentEnabled: consentEnabledRef.current,
        platform: recordingSource?.platform,
        processName: recordingSource?.processName,
      });

      // Only Zoom and Google Meet support keyboard-based consent.
      // Teams is handled by useTeamsConsentNotifier; other platforms
      // (Webex, GoTo, etc.) have no keyboard shortcut support.
      const platform = recordingSource?.platform;
      if (platform && platform !== "zoom" && platform !== "gmeet") {
        log.info("Unsupported platform for keyboard consent — skipping", {
          platform,
        });
        return;
      }

      // Delay dispatch so the Live View window finishes opening first.
      // Without this, the Live View creation steals focus from the target
      // app during the activation polling, causing repeated failures.
      clearConsentDelayTimer();
      const session = chatState.sessionId;
      chatState.consentDelayTimer = setTimeout(() => {
        chatState.consentDelayTimer = null;
        if (chatState.sessionId !== session) return;
        if (!isRecordingActive()) return;
        log.info("Consent dispatch delay elapsed, sending");
        trySendChatMessage(
          { consentEnabled: consentEnabledRef.current },
          recordingSource,
        );
      }, CONSENT_DISPATCH_DELAY_MS);
    });

    return () => {
      unsubRecorder();
      handleNotifierUnmount();
    };
  }, []);
};

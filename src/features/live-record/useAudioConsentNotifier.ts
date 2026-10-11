import {
  CONSENT_AUDIO_TRANSCRIPT,
  playConsentAudio,
} from "@/features/audio-consent";
import { useDesktopConsentPolicy } from "@/features/consent-policy";
import { useConsentDeliveryStore } from "@/features/live-record/consent-delivery.store";
import { useRecorder } from "@/features/live-record/record.store";
import { reportConsentNotice } from "@/features/recording-consent";
import { useLocalSettings } from "@/features/settings/useLocalSettings";
import { Logger } from "@/logger";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import {
  ClientConsentChannel,
  ClientConsentOutcome,
} from "@firefliesai/mobile-ff.graphql-client";
import { useEffect, useRef } from "react";

const log = new Logger("AudioConsent");

const AUDIO_CONSENT_DELAY_MS = 10_000;

/** Files what became of the announcement, when there is a meeting to file it against. */
const record = (
  meetingId: string | undefined,
  outcome: ClientConsentOutcome,
  reason?: string,
) => {
  // The announcement may finish after its recording stopped; it says nothing
  // about a recording that started since.
  if (meetingId === useRecorder.getState().context?.meetingId) {
    useConsentDeliveryStore
      .getState()
      .setAudio(outcome === ClientConsentOutcome.Sent ? "delivered" : "failed");
  }
  if (!meetingId) return;
  void reportConsentNotice({
    meetingId,
    channel: ClientConsentChannel.Audio,
    outcome,
    ...(reason && { reason }),
    // Only for an announcement that played: the wording is what participants
    // heard, and a failure means they heard nothing.
    ...(outcome === ClientConsentOutcome.Sent && {
      noticeBody: CONSENT_AUDIO_TRANSCRIPT,
    }),
  });
};

/**
 * Plays an audio consent message through system speakers when a desktop
 * recording starts, so participants hear it via the user's microphone.
 * Controlled by the local `audioConsentEnabled` setting, or by the team's
 * policy when the admins require it.
 */
export const useAudioConsentNotifier = () => {
  const audioConsentEnabled = useLocalSettings((s) => s.audioConsentEnabled);
  // The team can require the notice; the member's own switch decides otherwise.
  const audioRequired = useDesktopConsentPolicy().audio;
  const enabledRef = useRef(audioRequired || audioConsentEnabled);
  enabledRef.current = audioRequired || audioConsentEnabled;

  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;

    log.info("Hook mounted");

    let audioPlayedForSession = false;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubRecorder = useRecorder.subscribe((state, prevState) => {
      const justStopped =
        prevState.status.state !== "inactive" &&
        state.status.state === "inactive";

      if (justStopped) {
        log.info("Recording stopped, resetting audio consent state");
        audioPlayedForSession = false;
        useConsentDeliveryStore.getState().setAudio("idle");
        if (delayTimer) {
          clearTimeout(delayTimer);
          delayTimer = null;
        }
        return;
      }

      if (state.status.state !== "recording") return;

      const justStarted =
        prevState.status.state !== "recording" &&
        state.status.state === "recording";
      const contextChanged = state.context !== prevState.context;

      if (!justStarted && !contextChanged) return;
      if (audioPlayedForSession) return;
      if (!enabledRef.current) return;

      if (!state.context) {
        log.info("Recording started — awaiting context update");
        return;
      }

      audioPlayedForSession = true;
      const platform = state.context.recordingSource?.platform;
      log.info("Recording detected, scheduling audio consent", { platform });
      useConsentDeliveryStore.getState().setAudio("pending");

      delayTimer = setTimeout(() => {
        delayTimer = null;
        // Paused during the delay: re-arm so resuming plays the announcement.
        if (useRecorder.getState().status.state !== "recording") {
          audioPlayedForSession = false;
          return;
        }
        if (!enabledRef.current) return;

        // Read here rather than when the delay was scheduled: this is the
        // moment the announcement is actually made.
        const meetingId = useRecorder.getState().context?.meetingId;

        playConsentAudio()
          .then((played) => {
            if (played) {
              record(meetingId, ClientConsentOutcome.Sent);
              return;
            }
            // Resolved without playing — the asset was not found.
            log.warn("Consent audio unavailable, nothing announced");
            record(meetingId, ClientConsentOutcome.Failed, "asset-missing");
          })
          .catch((error) => {
            log.error("Failed to play audio consent message", {
              error: error instanceof Error ? error.message : String(error),
            });
            record(meetingId, ClientConsentOutcome.Failed, "playback-failed");
          });
      }, AUDIO_CONSENT_DELAY_MS);
    });

    return () => {
      unsubRecorder();
      if (delayTimer) {
        clearTimeout(delayTimer);
        delayTimer = null;
      }
    };
  }, []);
};

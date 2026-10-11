import { useState } from "react";
import { getActualPlatform, isDesktop } from "@/utils/device";
import { copyAsText } from "@/utils/clipboard";
import {
  isCameraBadgeLive,
  useVirtualCameraStatus,
} from "@/features/camera-consent";
import { useDesktopConsentPolicy } from "@/features/consent-policy";
import { DEFAULT_CONSENT_MESSAGE } from "@/features/live-record/browser-meeting-chat-state";
import { useRecordingPreferencesQuery } from "@/graphql";
import { useLocalSettings } from "@/features/settings/useLocalSettings";
import { isTeamsPlatform } from "@/features/desktop-meeting-detection";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useLiveScreenContext } from "../../Context/LiveScreenContext";
import {
  consentChannelOutcome,
  needsManualConsent,
} from "./manualConsentFallback";

interface ConsentFooter {
  /** Whether the consent message banner should be shown. */
  show: boolean;
  /** True briefly after the user copies, for button feedback. */
  copied: boolean;
  onCopy: () => void;
}

/**
 * Drives the consent message banner inside the live view. Shows only when no
 * channel announces consent to the meeting: chat auto-send, the spoken audio
 * message and the camera badge are each off, unsupported here, or have failed
 * terminally.
 */
export function useConsentFooter(): ConsentFooter {
  const { recordingContext } = useLiveScreenContext();
  const { data: prefsData, loading: prefsLoading } =
    useRecordingPreferencesQuery();
  const required = useDesktopConsentPolicy();
  const ownAudioConsent = useLocalSettings((s) => s.audioConsentEnabled);
  const audioConsentEnabled = required.audio || ownAudioConsent;
  const { status: cameraStatus } = useVirtualCameraStatus();
  const [copied, setCopied] = useState(false);

  const consentEnabled =
    required.chat ||
    (prefsData?.recordingPreferences?.teamsConsentEnabled ?? false);
  const recState = recordingContext?.state;
  const isRecording = recState === "recording" || recState === "paused";
  const isWindows = getActualPlatform() === "win32";

  // Keyboard chat auto-send is macOS-only and covers Zoom/Meet or a recording
  // whose platform isn't detected yet (useBrowserConsentNotifier); Teams goes
  // through the server on both OSes (useTeamsConsentNotifier). Other platforms
  // have no automatic chat delivery at all.
  const platform = recordingContext?.platform?.toLowerCase();
  const autoSendCanRun =
    consentEnabled &&
    (isTeamsPlatform(platform ?? "") ||
      (!isWindows &&
        (!platform || platform === "zoom" || platform === "gmeet")));

  // The badge has no pending state: it is either on participants' screens or
  // there is no consumer to show it to.
  const cameraDelivered = isCameraBadgeLive(cameraStatus, recState);

  // The announcement is only scheduled when recording starts: enabling it
  // mid-recording leaves the status idle, and nothing will be played.
  const audioDelivery = recordingContext?.audioConsentDelivery;
  const audioScheduled = audioConsentEnabled && audioDelivery !== "idle";

  // Only evaluated once the chat setting is known (otherwise the loading
  // default consentEnabled=false would flash the banner).
  const needsManual = needsManualConsent([
    consentChannelOutcome(autoSendCanRun, recordingContext?.consentDelivery),
    consentChannelOutcome(audioScheduled, audioDelivery),
    cameraDelivered ? "delivered" : "off",
  ]);

  const show =
    isDesktop && isRecording && !prefsLoading && !!prefsData && needsManual;

  const onCopy = () => {
    tracker.track(TRACKING_EVENTS.DESKTOP_CONSENT_MESSAGE_COPIED);
    copyAsText(DEFAULT_CONSENT_MESSAGE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { show, copied, onCopy };
}

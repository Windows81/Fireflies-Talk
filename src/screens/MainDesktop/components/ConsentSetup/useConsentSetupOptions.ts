import {
  isVirtualCameraReady,
  readVirtualCameraStatus,
  setVirtualCameraEnabled,
  useVirtualCameraStatus,
} from "@/features/camera-consent";
import {
  isCameraNoticeSetupOwed,
  useDesktopConsentPolicy,
} from "@/features/consent-policy";
import { useLocalSettings } from "@/features/settings";
import { useSetTeamsConsent } from "@/features/teams-consent";
import {
  type ConsentChannel,
  type ConsentSnapshot,
  trackConsentUpdated,
} from "@/features/recording-consent";
import { useRecordingPreferencesQuery } from "@/graphql";
import { getActualPlatform } from "@/utils/device";
import { useCallback, useState } from "react";
import {
  type ConsentChoices,
  withRequiredChoices,
} from "./withRequiredChoices";

const ALL_ENABLED: ConsentChoices = { audio: true, camera: true, chat: true };

/**
 * Every row starts ticked, including the ones this platform cannot offer, so
 * the choices alone would claim a camera notice on a machine that has none.
 */
function consentSnapshot(
  choices: ConsentChoices,
  cameraSupported: boolean,
  chatSupported: boolean,
): ConsentSnapshot {
  return {
    audio: choices.audio,
    camera: cameraSupported ? choices.camera : null,
    chat: chatSupported ? choices.chat : null,
  };
}

/**
 * Backs the consent setup modal: which rows this platform can offer, what the
 * user ticked, and applying the lot on Continue.
 *
 * On the install's first card every row starts on; on any later one, a row
 * starts as it is configured, so answering it changes nothing the member did
 * not touch. Continue writes only the rows that differ from what is already
 * configured, so an already-installed camera is never reinstalled.
 */
export function useConsentSetupOptions({ firstRun }: { firstRun: boolean }) {
  const required = useDesktopConsentPolicy();
  const [touchedChoices, setTouchedChoices] = useState<Partial<ConsentChoices>>(
    {},
  );

  const { status: cameraStatus } = useVirtualCameraStatus();
  const audioConsentEnabled = useLocalSettings((s) => s.audioConsentEnabled);
  const setAudioConsentEnabled = useLocalSettings(
    (s) => s.setAudioConsentEnabled,
  );
  const { data } = useRecordingPreferencesQuery({
    fetchPolicy: "cache-and-network",
  });
  const { setTeamsConsent } = useSetTeamsConsent();

  const chatEnabled = data?.recordingPreferences?.teamsConsentEnabled ?? false;
  const cameraSupported = Boolean(cameraStatus?.supported);
  const cameraInstalled = Boolean(cameraStatus?.installed);
  // Re-read when the window regains focus, which is how a toggle flipped in
  // System Settings gets noticed.
  const cameraReady = isVirtualCameraReady(cameraStatus);
  // Auto-sending to Meet/Zoom/Teams rides the macOS-only accessibility keyboard
  // module, which is why Settings hides the same preference elsewhere.
  const chatSupported = getActualPlatform() === "darwin";

  const startingChoices: ConsentChoices = firstRun
    ? ALL_ENABLED
    : {
        audio: audioConsentEnabled,
        camera: cameraInstalled,
        chat: chatEnabled,
      };
  const choices = withRequiredChoices(
    { ...startingChoices, ...touchedChoices },
    required,
  );

  const setChoice = useCallback(
    (key: ConsentChannel, value: boolean) => {
      if (required[key]) return;
      setTouchedChoices((previous) => ({ ...previous, [key]: value }));
    },
    [required],
  );

  /**
   * Writes the ticked options and reports whether the camera notice actually
   * works afterwards — the one outcome the caller may have to wait on.
   *
   * Reported as plain readiness rather than macOS's `awaitingApproval`, which is
   * only set when a fresh install request is parked: an extension the user has
   * switched off in System Settings comes back neither installed nor awaiting
   * anything, and that has to reach the user just the same. Returned rather than
   * read off the status, which the main process pushes a moment later.
   */
  const apply = useCallback(async (): Promise<{ cameraReady: boolean }> => {
    const snapshot = consentSnapshot(choices, cameraSupported, chatSupported);
    const trackChange = (channel: ConsentChannel) =>
      trackConsentUpdated({
        channel,
        enabled: choices[channel],
        snapshot,
        source: "consent-setup",
      });

    if (!required.audio && choices.audio !== audioConsentEnabled) {
      setAudioConsentEnabled(choices.audio);
      trackChange("audio");
    }

    const chatChanged =
      !required.chat && chatSupported && choices.chat !== chatEnabled;
    if (chatChanged) trackChange("chat");
    const chatTask = chatChanged
      ? setTeamsConsent(choices.chat).catch(() => {
          // Apollo's onError link surfaces toasts globally.
        })
      : Promise.resolve();

    const cameraChanged = cameraSupported && choices.camera !== cameraInstalled;
    if (cameraChanged) trackChange("camera");
    const cameraTask = cameraChanged
      ? setVirtualCameraEnabled(choices.camera)
      : Promise.resolve(undefined);

    const [, nextCamera] = await Promise.all([chatTask, cameraTask]);

    // Nothing submitted for the camera: its readiness is whatever it already was.
    if (!cameraChanged) return { cameraReady };

    // Ask the device rather than believing the request. Windows answers ready
    // straight away — registration is per-user, needing neither approval nor
    // elevation — while macOS may have put its own alert up and changed nothing.
    const settled = await readVirtualCameraStatus();
    return { cameraReady: isVirtualCameraReady(settled ?? nextCamera) };
  }, [
    audioConsentEnabled,
    cameraInstalled,
    cameraReady,
    cameraSupported,
    chatEnabled,
    chatSupported,
    choices,
    required,
    setAudioConsentEnabled,
    setTeamsConsent,
  ]);

  // The audio message plays through the speakers, so it needs nothing from the
  // platform and is always on offer.
  return {
    available: { camera: cameraSupported, chat: chatSupported },
    cameraReady,
    /** The admin's camera notice is still off here: the card may not close. */
    cameraSetupOwed: isCameraNoticeSetupOwed(required.camera, cameraStatus),
    choices,
    required,
    snapshot: consentSnapshot(choices, cameraSupported, chatSupported),
    setChoice,
    apply,
  };
}

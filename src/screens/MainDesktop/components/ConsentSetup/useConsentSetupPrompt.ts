import { useAuth } from "@/features/auth";
import { useVirtualCameraStatus } from "@/features/camera-consent";
import {
  forgetLiftedConsentRequirements,
  hasUnseenConsentRequirement,
  isCameraNoticeSetupOwed,
  markConsentRequirementsSeen,
  shownConsentRequirements,
  useConsentPolicyStore,
  useConsentRequirementsSeenStore,
  useDesktopConsentPolicy,
} from "@/features/consent-policy";
import type {
  ConsentChannel,
  ConsentSetupOutcome,
} from "@/features/recording-consent";
import { getLocalSettings, useLocalSettings } from "@/features/settings";
import { Logger } from "@/logger";
import { popToDesktopHome } from "@/screens/RootNavigation";
import { getActualPlatform } from "@/utils/device";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo } from "react";
import {
  consumeConsentSetupStart,
  openConsentSetup,
  openConsentSetupIfClosed,
  useConsentSetupPromptStore,
} from "./consentSetupPrompt.store";

const log = new Logger("ConsentSetup");

const NOTHING_SEEN: ConsentChannel[] = [];

/** Read before the card claims the one-time setup for itself. */
function isFirstRun(): boolean {
  return !getLocalSettings().consentSetupSeen;
}

/**
 * Brings the card's own screen forward before it appears.
 *
 * Only the header's click starts on this screen. The tray, a notification and
 * mic detection all fire while the window may be hidden or parked on Settings
 * or Live, and the card renders inside the home screen — one nobody can see
 * would hold its recording forever.
 */
function revealHomeScreen(): void {
  popToDesktopHome();

  if (!window.electron?.window.showMain) return;
  void window.electron.window.showMain().catch((error: Error) => {
    log.warn("Could not bring the main window forward", { error });
  });
}

/**
 * Owns whether the one-time consent setup is still owed, and the recording it is
 * holding while on screen. `pending` is what makes the first notes of an install
 * — clicked, automated or from a notification — open the card first.
 *
 * The card also opens by itself whenever the admin requires a notice this
 * account has not seen it name yet, so the member learns it is on, and on
 * every launch while the team requires the camera notice and this device can
 * turn it on but has not; it then stays up until the camera works.
 */
export function useConsentSetupPrompt() {
  const seen = useLocalSettings((state) => state.consentSetupSeen);
  const visible = useConsentSetupPromptStore((state) => state.visible);
  const holdingStart = useConsentSetupPromptStore(
    (state) => state.pendingStart !== null,
  );
  const accountId = useAuth((state) => state.user?.id) ?? null;
  const policy = useDesktopConsentPolicy();
  const policyLoaded = useConsentPolicyStore((state) => state.loaded);
  const { status: cameraStatus } = useVirtualCameraStatus();
  const cameraNoticeOwed = isCameraNoticeSetupOwed(policy.camera, cameraStatus);

  const cameraShown = Boolean(cameraStatus?.supported);
  const shownRequirements = useMemo(
    () =>
      shownConsentRequirements(policy, {
        camera: cameraShown,
        chat: getActualPlatform() === "darwin",
      }),
    [policy, cameraShown],
  );
  const requirementsSeen = useConsentRequirementsSeenStore((state) =>
    accountId ? (state.seenByAccount[accountId] ?? NOTHING_SEEN) : NOTHING_SEEN,
  );
  const unseenRequirement =
    accountId !== null &&
    hasUnseenConsentRequirement(shownRequirements, requirementsSeen);
  const cardOwed = cameraNoticeOwed || unseenRequirement;

  useEffect(() => {
    if (policyLoaded && accountId) {
      forgetLiftedConsentRequirements(accountId, policy);
    }
  }, [policyLoaded, accountId, policy]);

  const isFocused = useIsFocused();

  // Asked again whenever the screen comes back, since leaving it answers the
  // card. Only the focused copy asks, and not on every close: this status and
  // the card's own are separate reads, and a stale "still off" here must not
  // bring the card back the moment it closed on the camera turning on.
  useEffect(() => {
    if (!cardOwed || !isFocused) return;
    const firstRun = isFirstRun();
    getLocalSettings().setConsentSetupSeen(true);
    openConsentSetupIfClosed({ firstRun });
  }, [cardOwed, isFocused]);

  /**
   * Hands the card the recording that was about to start. It runs `start` once
   * the user has answered — however they answer — so the start is delayed rather
   * than lost, and the consent choices apply to this recording, not the next.
   */
  const show = useCallback((start: () => void) => {
    const firstRun = isFirstRun();
    // Marked seen the moment it appears. A card that came back after being
    // dismissed would stand between the user and every first recording.
    getLocalSettings().setConsentSetupSeen(true);
    revealHomeScreen();
    openConsentSetup(start, { firstRun });
  }, []);

  /**
   * Closes the card and starts what it was holding. Whatever it named counts
   * as seen, unless something navigated the card away before it was answered.
   */
  const finish = useCallback(
    (outcome: ConsentSetupOutcome) => {
      if (outcome !== "interrupted" && accountId) {
        markConsentRequirementsSeen(accountId, shownRequirements);
      }
      consumeConsentSetupStart()?.();
    },
    [accountId, shownRequirements],
  );

  return { pending: !seen, visible, holdingStart, show, finish };
}

export type ConsentSetupPrompt = ReturnType<typeof useConsentSetupPrompt>;

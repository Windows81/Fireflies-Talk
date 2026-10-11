import {
  isVirtualCameraReady,
  readVirtualCameraStatus,
  setVirtualCameraEnabled,
} from "@/features/camera-consent";
import { Logger } from "@/logger";
import { popToDesktopHome } from "@/screens/RootNavigation";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { getActualPlatform } from "@/utils/device";
import type { VirtualCameraStatus } from "electron/src/types";
import { openCameraNoticeGuidance } from "./cameraNoticeGuidance.store";
import type { DesktopConsentPolicy } from "./desktopConsentPolicy";
import { ensureFreshDesktopConsentPolicy } from "./refreshConsentPolicy";

/**
 * Whether a recording may start under the team's consent policy. Only the
 * camera notice can refuse a start: the spoken and chat notices need nothing
 * from the member, so their notifiers apply them once the recording runs.
 */
export type ConsentStartVerdict =
  | { allowed: true }
  | {
      allowed: false;
      reason: "camera-notice-required";
      /** Null when the device could not even be asked. */
      cameraStatus: VirtualCameraStatus | null;
    };

export interface ConsentEnforcementGateDeps {
  ensureFreshPolicy: () => Promise<DesktopConsentPolicy>;
  /** Null or undefined when there is no camera bridge to ask. */
  readCameraStatus: () => Promise<VirtualCameraStatus | null | undefined>;
  enableCamera: () => Promise<VirtualCameraStatus | null | undefined>;
  platform: string;
  /** Brings the home screen forward to explain the refusal. */
  showGuidance: (status: VirtualCameraStatus) => void;
  track: (
    event: TRACKING_EVENTS,
    properties: NonNullable<Parameters<typeof tracker.track>[1]>,
  ) => void;
  log: Pick<Logger, "info" | "warn">;
}

/**
 * The one check every desktop recording start makes, right before the
 * meeting is created. The camera notice is the one notice the app cannot
 * switch on by itself, and a recording the admins required a badge for must
 * not begin without one; every device that cannot show it is refused too.
 */
export async function checkConsentEnforcement(
  deps: ConsentEnforcementGateDeps,
): Promise<ConsentStartVerdict> {
  const policy = await deps.ensureFreshPolicy();
  if (!policy.camera) return { allowed: true };

  let status: VirtualCameraStatus | null;
  try {
    status = (await deps.readCameraStatus()) ?? null;
  } catch (error) {
    deps.log.warn("Could not read the camera status; allowing the recording", {
      error,
    });
    return { allowed: true };
  }
  // A device that cannot be asked is not one the member can fix; the
  // recording goes ahead, as every other failed lookup in this app does.
  if (status === null) {
    deps.log.warn("No camera bridge to ask; allowing the recording");
    return { allowed: true };
  }
  if (isVirtualCameraReady(status)) return { allowed: true };

  // Windows registers the filter per user with no approval step, so the
  // requirement can be met on the spot instead of sending the member away.
  if (deps.platform === "win32" && status.supported && !status.installed) {
    try {
      status = (await deps.enableCamera()) ?? status;
    } catch (error) {
      deps.log.warn("Could not install the required camera notice", { error });
    }
    if (isVirtualCameraReady(status)) return { allowed: true };
  }

  deps.log.info("Recording refused: the team requires the camera notice", {
    supported: status.supported,
    installed: status.installed,
    awaitingApproval: status.awaitingApproval,
    unsupportedReason: status.unsupportedReason,
  });
  deps.track(TRACKING_EVENTS.DESKTOP_CONSENT_START_BLOCKED, {
    reason: "camera-notice-required",
    platform: deps.platform,
    supported: status.supported,
    installed: status.installed,
    awaitingApproval: status.awaitingApproval,
    unsupportedReason: status.unsupportedReason ?? null,
  });
  deps.showGuidance(status);
  return {
    allowed: false,
    reason: "camera-notice-required",
    cameraStatus: status,
  };
}

const log = new Logger("ConsentEnforcement");

/**
 * Brings the home screen forward: the tray, a notification, the shortcut and
 * mic detection all fire while the window may be hidden or parked on Settings
 * or Live. A device that can turn the camera on finds the consent card up
 * there already, waiting on it; only one that never can gets the guidance
 * card's explanation.
 */
function revealCameraNoticeGuidance(status: VirtualCameraStatus): void {
  popToDesktopHome();
  if (!status.supported) openCameraNoticeGuidance();
  void window.electron?.window.showMain?.().catch((error: Error) => {
    log.warn("Could not bring the main window forward", { error });
  });
}

/** The gate `RecordActionsContext.startRecording` runs before anything is created. */
export function checkConsentEnforcementBeforeStart(): Promise<ConsentStartVerdict> {
  return checkConsentEnforcement({
    ensureFreshPolicy: () => ensureFreshDesktopConsentPolicy(),
    readCameraStatus: async () => (await readVirtualCameraStatus()) ?? null,
    enableCamera: () => setVirtualCameraEnabled(true),
    platform: getActualPlatform(),
    showGuidance: revealCameraNoticeGuidance,
    track: (event, properties) => tracker.track(event, properties),
    log,
  });
}

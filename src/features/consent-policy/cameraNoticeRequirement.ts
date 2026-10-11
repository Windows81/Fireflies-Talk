import { isVirtualCameraReady } from "@/features/camera-consent/virtualCameraReady";
import type { VirtualCameraStatus } from "electron/src/types";

export type CameraNoticeRequirementAction = "set-up" | "open-system-settings";

export interface CameraNoticeRequirement {
  title: string;
  body: string;
  /** Show the macOS approval walk-through under the body. */
  showSteps: boolean;
  /** In display order; empty when the device cannot be fixed from here. */
  actions: CameraNoticeRequirementAction[];
}

/**
 * Whether the consent card must stay up until the camera notice works: the
 * team requires it and this device can turn it on but has not. A device that
 * can never run it is left to the start gate's refusal, which explains why.
 */
export function isCameraNoticeSetupOwed(
  required: boolean,
  status: VirtualCameraStatus | null,
): boolean {
  return (
    required && Boolean(status?.supported) && !isVirtualCameraReady(status)
  );
}

const ADMIN_REQUIRES =
  "Your workspace admin requires the camera recording notice";
const TURN_ON_TITLE = "Turn on the Fireflies camera to take notes";

/**
 * What to tell a member whose team requires the camera notice while this
 * device cannot show it yet. Every branch names the requirement and what, if
 * anything, the member can do; a device that can never comply is told so
 * plainly, so nobody keeps retrying a recording that will never start.
 */
export function describeCameraNoticeRequirement(
  status: VirtualCameraStatus | null,
  platform: string,
): CameraNoticeRequirement {
  if (status && !status.supported) {
    switch (status.unsupportedReason) {
      case "not-in-applications":
        return {
          title: "Move Fireflies to your Applications folder",
          body: `${ADMIN_REQUIRES}, and macOS only installs camera extensions from apps in /Applications. Move Fireflies there and open it again to take notes.`,
          showSteps: false,
          actions: [],
        };
      case "payload-missing":
        return {
          title: "Reinstall Fireflies to take notes",
          body: `${ADMIN_REQUIRES}, but this install is missing the Fireflies camera. Reinstall Fireflies from fireflies.ai to take notes.`,
          showSteps: false,
          actions: [],
        };
      default:
        return {
          title: "This device can't run the Fireflies camera",
          body:
            platform === "darwin"
              ? `${ADMIN_REQUIRES}, which needs macOS 12.3 or later. Until this Mac is updated you can't take notes from the desktop app.`
              : `${ADMIN_REQUIRES}, which isn't available on this platform. You can't take notes from the desktop app on this device.`,
          showSteps: false,
          actions: [],
        };
    }
  }

  if (platform === "win32") {
    return {
      title: TURN_ON_TITLE,
      body: `${ADMIN_REQUIRES}. Setting it up takes a moment and needs no restart.`,
      showSteps: false,
      actions: ["set-up"],
    };
  }

  return {
    title: TURN_ON_TITLE,
    body: `${ADMIN_REQUIRES}. macOS keeps camera extensions switched off until you allow this one.`,
    showSteps: true,
    // Once the request is parked in System Settings, asking again would only
    // put a second OS alert up over the first.
    actions: status?.awaitingApproval
      ? ["open-system-settings"]
      : ["set-up", "open-system-settings"],
  };
}

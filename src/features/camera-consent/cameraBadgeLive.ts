import type { VirtualCameraStatus } from "electron/src/types";

/**
 * Whether participants are being shown the camera badge right now: a recording
 * is feeding a consumer through a healthy relay. `relayHealthy` matters because
 * an unhealthy relay shows the unavailable-camera card instead of the badge.
 */
export const isCameraBadgeLive = (
  status: VirtualCameraStatus | null,
  recordingState: string | undefined,
): boolean =>
  recordingState === "recording" &&
  Boolean(status?.installed) &&
  (status?.consumers ?? 0) > 0 &&
  Boolean(status?.relayHealthy);

import type { VirtualCameraStatus } from "electron/src/types";

/** Enough of a status or an activation result to judge readiness by. */
type CameraState = Pick<VirtualCameraStatus, "installed" | "awaitingApproval">;

/**
 * Whether the camera notice will actually reach a meeting: the device exists and
 * the OS is not still holding it back.
 *
 * Not the same question as "did the request succeed". An extension the user has
 * switched off under Login Items & Extensions completes its activation request
 * without ever reporting `awaitingApproval`, so the request's verdict can read
 * as success while no device exists.
 */
export const isVirtualCameraReady = (state?: CameraState | null): boolean =>
  Boolean(state?.installed && !state.awaitingApproval);

/** The device's current state, asked fresh rather than taken from a request. */
export const readVirtualCameraStatus = ():
  | Promise<VirtualCameraStatus>
  | undefined => window.electron?.virtualCamera?.getStatus();

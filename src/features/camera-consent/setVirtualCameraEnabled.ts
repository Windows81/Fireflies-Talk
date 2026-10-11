import type { VirtualCameraStatus } from "electron/src/types";

/**
 * Installs or removes the Fireflies camera device, resolving with the status
 * the main process reports afterwards.
 */
export const setVirtualCameraEnabled = async (
  enabled: boolean,
): Promise<VirtualCameraStatus | undefined> => {
  const camera = window.electron?.virtualCamera;
  return enabled ? camera?.enable() : camera?.disable();
};

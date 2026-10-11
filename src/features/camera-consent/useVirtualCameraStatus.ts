import { useWindowFocus } from "@/hooks/useWindowFocus";
import type { VirtualCameraStatus } from "electron/src/types";
import { useCallback, useEffect, useState } from "react";

/**
 * Tracks the desktop virtual camera device. Null until the first status
 * arrives, and on platforms with no camera bridge at all.
 */
export function useVirtualCameraStatus() {
  const [status, setStatus] = useState<VirtualCameraStatus | null>(null);

  const refresh = useCallback(async () => {
    const next = await window.electron?.virtualCamera?.getStatus();
    if (next) setStatus(next);
  }, []);

  useEffect(() => {
    refresh();
    return window.electron?.virtualCamera?.onStatusChanged(setStatus);
  }, [refresh]);

  // The extension can be approved or removed in System Settings while the app
  // is backgrounded, so re-read on focus rather than trusting local state.
  useWindowFocus(refresh);

  return { status, setStatus };
}

import { useEffect, useState } from "react";
import { isDesktop } from "@/utils/device";

/**
 * Current renderer zoom factor (Cmd +/-/0). Defaults to 1 off-desktop.
 *
 * macOS renders window content at this factor while the native traffic lights
 * stay pinned at a fixed point position. Any CSS offset that clears the traffic
 * lights must be divided by this factor to keep a constant on-screen position.
 */
export const useDesktopZoom = (): number => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isDesktop || !window.electron) return;
    window.electron.window
      .getZoomFactor()
      .then(setZoom)
      .catch(() => {});
    return window.electron.window.onZoomFactorChanged(setZoom);
  }, []);

  return zoom;
};

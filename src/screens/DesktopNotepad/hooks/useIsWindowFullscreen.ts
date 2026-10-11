import { useEffect, useState } from "react";

export const useIsWindowFullscreen = (): boolean => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const electron = window.electron;
    if (!electron?.onWindowFullscreenChange) return;

    electron.isWindowFullscreen?.().then(setIsFullscreen);
    return electron.onWindowFullscreenChange(setIsFullscreen);
  }, []);

  return isFullscreen;
};

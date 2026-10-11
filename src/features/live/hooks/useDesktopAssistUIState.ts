import { useEffect, useState, useCallback } from "react";
import { isDesktop } from "@/utils/device";

export interface UseDesktopAssistUIStateReturn {
  isCompactView: boolean;
  toggleViewMode: () => void;
}

/**
 * Manages the UI state (compact/full view) for the desktop Live Assist window
 */
export const useDesktopAssistUIState = (): UseDesktopAssistUIStateReturn => {
  const [isCompactView, setIsCompactView] = useState(isDesktop);

  // Sync compact/full mode with Electron (if available)
  useEffect(() => {
    if (!isDesktop || !window.electron?.liveView) return;

    window.electron.liveView
      .getMode()
      .then((mode: "compact" | "full") => setIsCompactView(mode === "compact"))
      .catch(() => undefined);

    const removeListener = window.electron.liveView.onModeChanged(
      (mode: "compact" | "full") => {
        setIsCompactView(mode === "compact");
      },
    );

    return () => {
      removeListener();
    };
  }, []);

  const toggleViewMode = useCallback(() => {
    if (!isDesktop) return;
    const api = window.electron?.liveView;
    if (!api) return;
    const next = isCompactView ? "full" : "compact";
    try {
      // persist: this is an explicit user choice, so save it as their default.
      api.setMode(next, true);
    } catch {
      // ignore
    }
  }, [isCompactView]);

  return {
    isCompactView,
    toggleViewMode,
  };
};

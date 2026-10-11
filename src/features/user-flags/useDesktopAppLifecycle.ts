import { useEffect, useRef } from "react";
import { isDesktop } from "@/utils/device";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useDesktopLifecycleStore } from "./desktopLifecycleStore";
import { getLocalSettings } from "@/features/settings/useLocalSettings";

/**
 * Hook to track desktop app lifecycle events:
 * - App Opened (every open)
 * - App Installed (first open)
 * - App Updated (version change, distinguishes auto-update vs manual DMG)
 *
 * Also listens for auto-update downloads to set the pendingAutoUpdate flag.
 *
 * Should be called once at app startup (e.g., in Navigator.tsx)
 */
export function useDesktopAppLifecycle() {
  const hasTracked = useRef(false);

  const {
    firstOpenCompleted,
    lastKnownVersion,
    pendingAutoUpdate,
    setFirstOpenCompleted,
    setLastKnownVersion,
    setPendingAutoUpdate,
    setInstalledAt,
  } = useDesktopLifecycleStore();

  // Track lifecycle events on mount
  useEffect(() => {
    // Only run on desktop and only once per app session
    if (!isDesktop || hasTracked.current) {
      return;
    }

    const trackLifecycleEvents = async () => {
      try {
        // Get current app version from electron
        const currentVersion = await window.electron?.updater?.getVersion();
        if (!currentVersion) {
          return;
        }

        hasTracked.current = true;

        // Check if this is a fresh install (first open ever)
        if (!firstOpenCompleted) {
          tracker.track(TRACKING_EVENTS.DESKTOP_APP_INSTALLED, {
            version: currentVersion,
          });
          setFirstOpenCompleted(true);
          setLastKnownVersion(currentVersion);
          setInstalledAt(Date.now());

          // Enable launch at startup by default on first install
          window.electron?.app
            ?.setLoginItemSettings(true)
            ?.then(() => {
              getLocalSettings().setLaunchAtStartup(true);
            })
            ?.catch((error) => {
              getLocalSettings().setLaunchAtStartup(false);
              console.error(
                "[DESKTOP_LIFECYCLE] Failed to set launch at startup on first install:",
                error,
              );
            });
        }
        // Check if version changed (app was updated)
        else if (lastKnownVersion && lastKnownVersion !== currentVersion) {
          const updateType = pendingAutoUpdate ? "auto" : "manual";
          tracker.track(TRACKING_EVENTS.DESKTOP_APP_UPDATED, {
            previousVersion: lastKnownVersion,
            version: currentVersion,
            updateType,
          });
          setLastKnownVersion(currentVersion);
          // Clear the pending auto-update flag
          if (pendingAutoUpdate) {
            setPendingAutoUpdate(false);
          }
        }

        // Always track app opened
        tracker.track(TRACKING_EVENTS.DESKTOP_APP_OPENED, {
          version: currentVersion,
        });
      } catch (error) {
        console.error("[DESKTOP_LIFECYCLE] Failed to track lifecycle:", error);
      }
    };

    trackLifecycleEvents();
  }, [
    firstOpenCompleted,
    lastKnownVersion,
    pendingAutoUpdate,
    setFirstOpenCompleted,
    setLastKnownVersion,
    setPendingAutoUpdate,
    setInstalledAt,
  ]);

  // Listen for auto-update downloads to set the pendingAutoUpdate flag
  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const unsubscribe = window.electron?.updater?.onStatusChanged?.(
      (status) => {
        // When an auto-update is downloaded, set the flag so we can track it
        // as "auto" update type when the app restarts with the new version
        if (status.updateDownloaded && !pendingAutoUpdate) {
          setPendingAutoUpdate(true);
        }
      },
    );

    return () => {
      unsubscribe?.();
    };
  }, [pendingAutoUpdate, setPendingAutoUpdate]);
}

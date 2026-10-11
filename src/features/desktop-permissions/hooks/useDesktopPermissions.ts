import { useCallback, useEffect, useState, useRef } from "react";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { useNavigation } from "@react-navigation/native";
import { isDesktop } from "@/utils/device";
import { useAuth } from "@/features/auth";
import type {
  PermissionType,
  PermissionStatus,
  PermissionState,
} from "electron/src/types";
import { RouteNames } from "@/constants";

export interface UseDesktopPermissionsReturn {
  /** Current state of all permissions */
  permissions: PermissionState | null;
  /** Whether permissions are being checked */
  isLoading: boolean;
  /** Whether all required permissions are granted */
  hasRequiredPermissions: boolean;
  /** Check a specific permission */
  checkPermission: (
    type: PermissionType,
  ) => Promise<PermissionStatus | undefined>;
  /** Request a specific permission (microphone shows system prompt; screen/systemAudio open settings) */
  requestPermission: (type: PermissionType) => Promise<boolean | undefined>;
  /** Open system settings for a specific permission */
  openSettings: (type: PermissionType) => Promise<void>;
  /** Refresh permissions state */
  refresh: () => Promise<void>;
}

/**
 * Hook to manage desktop permissions (microphone, camera, screen recording).
 * Only works on desktop Electron environment.
 * Handles checking permissions and navigating to permissions screen if needed.
 */
export const useDesktopPermissions = (options?: {
  /** Whether to auto-check permissions on mount */
  autoCheck?: boolean;
  /** Whether to auto-navigate to permissions screen if permissions are missing */
  autoNavigate?: boolean;
}): UseDesktopPermissionsReturn => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasNavigatedRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if permissions API is available
  const isAvailable = isDesktop && !!window.electron?.permissions;
  const platform = window.electron?.platform;
  const isMac = platform === "darwin";
  const isWindows = platform === "win32";

  // Calculate if all required permissions are granted
  // On macOS and Windows, microphone permission can be checked and may be denied
  const hasRequiredPermissions =
    isMac || isWindows ? permissions?.microphone === "granted" : true;

  const checkPermission = useCallback(
    async (type: PermissionType): Promise<PermissionStatus | undefined> => {
      if (!isAvailable) return undefined;

      try {
        return await window.electron!.permissions.check(type);
      } catch (error) {
        console.error(`[PERMISSIONS] Failed to check ${type}:`, error);
        return undefined;
      }
    },
    [isAvailable],
  );

  const refresh = useCallback(async () => {
    if (!isAvailable) return;

    setIsLoading(true);
    try {
      const state = await window.electron!.permissions.checkAll();
      setPermissions(state);

      // Auto-navigate to permissions screen if configured and permissions are missing
      // Only show if:
      // 1. User is logged in
      // 2. Permission was requested (not "not-determined")
      // 3. Permission is not granted
      // 4. Haven't already navigated
      if (
        options?.autoNavigate &&
        user &&
        (isMac || isWindows) &&
        state.microphone !== "not-determined" &&
        state.microphone !== "granted" &&
        !hasNavigatedRef.current
      ) {
        hasNavigatedRef.current = true;

        // Clear any existing timeout
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }

        // Add 5-second delay before showing the permissions screen
        navigationTimeoutRef.current = setTimeout(() => {
          navigation.navigate(RouteNames.DesktopSettings, {
            activeContent: "permissions",
          });
          navigationTimeoutRef.current = null;
        }, 5000);
      }
    } catch (error) {
      console.error("[PERMISSIONS] Failed to check permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, options?.autoNavigate, navigation, user, isMac, isWindows]);

  const requestPermission = useCallback(
    async (type: PermissionType): Promise<boolean | undefined> => {
      if (!isAvailable) return undefined;

      try {
        const granted = await window.electron!.permissions.request(type);
        // Refresh state after request
        await refresh();
        return granted;
      } catch (error) {
        console.error(`[PERMISSIONS] Failed to request ${type}:`, error);
        return undefined;
      }
    },
    [isAvailable, refresh],
  );

  const openSettings = useCallback(
    async (type: PermissionType): Promise<void> => {
      if (!isAvailable) return;

      try {
        await window.electron!.permissions.openSettings(type);
      } catch (error) {
        console.error(
          `[PERMISSIONS] Failed to open settings for ${type}:`,
          error,
        );
      }
    },
    [isAvailable],
  );

  useEffect(() => {
    // Reset navigation flag when permissions are granted
    if (hasRequiredPermissions) {
      hasNavigatedRef.current = false;
    }
  }, [hasRequiredPermissions]);

  // Auto-check permissions on mount if configured
  useEffect(() => {
    if (options?.autoCheck !== false && isAvailable) {
      refresh();
    }

    // Cleanup navigation timeout on unmount
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, [isAvailable, options?.autoCheck, refresh]);

  // Re-check permissions when the window regains focus
  // (user may have changed permissions in system settings)
  useWindowFocus(refresh);

  return {
    permissions,
    isLoading,
    hasRequiredPermissions,
    checkPermission,
    requestPermission,
    openSettings,
    refresh,
  };
};

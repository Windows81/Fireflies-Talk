import { useDesktopPermissions } from "@/features/desktop-permissions/hooks/useDesktopPermissions";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { getActualPlatform } from "@/utils/device";
import { useCallback, useEffect, useState } from "react";
import {
  allPermissionsGranted,
  type PermissionsGrantedInput,
} from "./permissionsGranted";

export interface OnboardingPermissions extends PermissionsGrantedInput {
  bothGranted: boolean;
  requestMic: () => Promise<void>;
  openAccessibilitySettings: () => void;
}

/**
 * Mic and accessibility state for the dictation onboarding. Owned by the step
 * router so it and the permissions screen agree on whether that screen still
 * has anything to ask for.
 */
export function useOnboardingPermissions(): OnboardingPermissions {
  const { permissions, requestPermission } = useDesktopPermissions({
    autoCheck: true,
  });
  const [accessibilityGranted, setAccessibilityGranted] = useState<
    boolean | null
  >(null);

  // The native check is macOS-only and reports false where its module is
  // absent, which would leave Windows users unable to finish onboarding.
  const needsAccessibility = getActualPlatform() === "darwin";

  const checkAccessibility = useCallback(async () => {
    if (!needsAccessibility) return;
    const result =
      await window.electron?.browserMeetings?.checkAccessibilityPermission();
    setAccessibilityGranted(result ?? null);
  }, [needsAccessibility]);

  useEffect(() => {
    checkAccessibility();
  }, [checkAccessibility]);

  // Granting either permission happens in System Settings, so the app only
  // learns about it when the user comes back.
  useWindowFocus(checkAccessibility);

  const micGranted = permissions?.microphone === "granted";

  const requestMic = useCallback(async () => {
    await requestPermission("microphone");
  }, [requestPermission]);

  const openAccessibilitySettings = useCallback(() => {
    window.electron?.browserMeetings?.openAccessibilitySettings();
  }, []);

  return {
    micGranted,
    accessibilityGranted,
    needsAccessibility,
    bothGranted: allPermissionsGranted({
      micGranted,
      accessibilityGranted,
      needsAccessibility,
    }),
    requestMic,
    openAccessibilitySettings,
  };
}

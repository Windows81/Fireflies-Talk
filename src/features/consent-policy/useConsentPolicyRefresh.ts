import { useAuth } from "@/features/auth";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { isMainDesktopWindow } from "@/utils/device";
import { useEffect } from "react";
import { resetDesktopConsentPolicy } from "./consentPolicy.store";
import {
  invalidateDesktopConsentPolicyRefresh,
  refreshDesktopConsentPolicy,
} from "./refreshConsentPolicy";

/** A focus that follows another within this window does not re-read. */
const FOCUS_REFRESH_THROTTLE_MS = 30_000;

/**
 * Keeps the policy current in the main window: read on sign-in, again on
 * focus, forgotten on sign-out. An in-flight read is dropped first, so its
 * reply cannot restore the previous account. Record starts re-read it
 * themselves. Safe to mount once per home-screen copy, since reads share one
 * request.
 */
export function useConsentPolicyRefresh(): void {
  const isSignedIn = Boolean(useAuth((state) => state.user));

  useEffect(() => {
    if (!isMainDesktopWindow()) return;
    if (!isSignedIn) {
      invalidateDesktopConsentPolicyRefresh();
      resetDesktopConsentPolicy();
      return;
    }
    void refreshDesktopConsentPolicy();
  }, [isSignedIn]);

  useWindowFocus(
    () => {
      if (isSignedIn && isMainDesktopWindow())
        void refreshDesktopConsentPolicy();
    },
    { throttleMs: FOCUS_REFRESH_THROTTLE_MS },
  );
}

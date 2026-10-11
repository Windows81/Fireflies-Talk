import { useAuth } from "@/features/auth";
import { useEffect } from "react";
import { useConsentPolicyStore } from "./consentPolicy.store";
import type { DesktopConsentPolicy } from "./desktopConsentPolicy";
import { refreshDesktopConsentPolicy } from "./refreshConsentPolicy";

/**
 * The team's admin-required consent notices, as last read. Nothing is required
 * until the first read lands; a surface mounting before any read triggers one
 * while someone is signed in, which is what gives the live view and Settings
 * an answer of their own. Signed out there is no team to ask.
 */
export function useDesktopConsentPolicy(): DesktopConsentPolicy {
  const policy = useConsentPolicyStore((state) => state.policy);
  const loaded = useConsentPolicyStore((state) => state.loaded);
  const isSignedIn = Boolean(useAuth((state) => state.user));

  useEffect(() => {
    if (isSignedIn && !loaded) void refreshDesktopConsentPolicy();
  }, [isSignedIn, loaded]);

  return policy;
}

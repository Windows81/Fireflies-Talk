import { useState, useEffect, useCallback } from "react";
import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import {
  readConsent,
  updateConsent,
  isGlobalPrivacyControlActive,
  type ConsentState,
} from "@/features/consent";
import { tracker } from "@/tracking";

type ConsentCategory = keyof ConsentState;

export const usePrivacyConsentState = () => {
  const [consentState, setConsentState] = useState<ConsentState>(readConsent);
  const [isGPC, setIsGPC] = useState(false);

  const isHeapDisabled = useFeatureIsOn(
    FEATURE_FLAGS.DISABLE_HEAP_COLLECTION as string,
  );

  const optOutAnalytics = isHeapDisabled;

  useEffect(() => {
    setIsGPC(isGlobalPrivacyControlActive());
  }, []);

  const updateCategory = useCallback(
    (category: ConsentCategory | ConsentCategory[], granted: boolean) => {
      const value = granted ? "granted" : "denied";
      const categories = Array.isArray(category) ? category : [category];
      const updates: Partial<ConsentState> = {};
      for (const cat of categories) {
        updates[cat] = value;
      }
      const updated = updateConsent(updates);
      setConsentState(updated);
      tracker.setEnabled(updated.analytics_storage === "granted");
    },
    [],
  );

  const togglesDisabled = optOutAnalytics || isGPC;

  return {
    consentState,
    isGlobalPrivacyControl: isGPC,
    optOutAnalytics,
    togglesDisabled,
    updateCategory,
  } as const;
};

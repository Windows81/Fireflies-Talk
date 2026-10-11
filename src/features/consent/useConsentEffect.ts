import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { tracker } from "@/tracking";
import { useEffect } from "react";
import { getEffectiveConsent, updateConsent } from "./consentManager";

export const useConsentEffect = () => {
  const isHeapDisabled = useFeatureIsOn(
    FEATURE_FLAGS.DISABLE_HEAP_COLLECTION as string,
  );

  useEffect(() => {
    if (isHeapDisabled) {
      updateConsent({
        ad_storage: "denied",
        analytics_storage: "denied",
        personalization_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      tracker.setEnabled(false);
      return;
    }

    const consent = getEffectiveConsent();
    tracker.setEnabled(consent.analytics_storage === "granted");
  }, [isHeapDisabled]);
};

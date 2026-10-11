import {
  readConsentFromStorage,
  writeConsentToStorage,
} from "./consentStorage";

type ConsentValue = "granted" | "denied";

export type ConsentState = {
  ad_storage: ConsentValue;
  analytics_storage: ConsentValue;
  functionality_storage: ConsentValue;
  personalization_storage: ConsentValue;
  ad_user_data: ConsentValue;
  ad_personalization: ConsentValue;
  security_storage: ConsentValue;
};

type ConsentCookie = ConsentState & {
  version: number;
  updated_at: number;
};

const ESSENTIAL_CATEGORIES: (keyof ConsentState)[] = [
  "functionality_storage",
  "security_storage",
];

export const NON_ESSENTIAL_CATEGORIES: (keyof ConsentState)[] = [
  "ad_storage",
  "analytics_storage",
  "personalization_storage",
  "ad_user_data",
  "ad_personalization",
];

export const DEFAULT_CONSENT_STATE: ConsentState = {
  ad_storage: "granted",
  analytics_storage: "granted",
  functionality_storage: "granted",
  personalization_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  security_storage: "granted",
};

export const readConsent = (): ConsentState => {
  try {
    const raw = readConsentFromStorage();
    if (!raw) return { ...DEFAULT_CONSENT_STATE };

    const parsed: ConsentCookie = JSON.parse(raw);
    const state = { ...DEFAULT_CONSENT_STATE };

    for (const key of NON_ESSENTIAL_CATEGORIES) {
      if (parsed[key] === "granted" || parsed[key] === "denied") {
        state[key] = parsed[key];
      }
    }

    for (const key of ESSENTIAL_CATEGORIES) {
      state[key] = "granted";
    }

    return state;
  } catch {
    return { ...DEFAULT_CONSENT_STATE };
  }
};

export const writeConsent = (state: ConsentState): void => {
  const cookie: ConsentCookie = {
    ...state,
    functionality_storage: "granted",
    security_storage: "granted",
    version: 1,
    updated_at: Date.now(),
  };
  writeConsentToStorage(JSON.stringify(cookie));
};

export const updateConsent = (updates: Partial<ConsentState>): ConsentState => {
  const current = readConsent();
  const essentialOverrides: Partial<ConsentState> = {};
  for (const key of ESSENTIAL_CATEGORIES) {
    essentialOverrides[key] = "granted";
  }

  const updated: ConsentState = {
    ...current,
    ...updates,
    ...essentialOverrides,
  };

  writeConsent(updated);
  return updated;
};

export const isGlobalPrivacyControlActive = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return (
    (navigator as unknown as Record<string, unknown>).globalPrivacyControl ===
    true
  );
};

export const getEffectiveConsent = (): ConsentState => {
  const state = readConsent();

  if (isGlobalPrivacyControlActive()) {
    return {
      ...state,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      personalization_storage: "denied",
    };
  }

  return state;
};

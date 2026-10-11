import type { RemoteConstants } from "@firefliesai/mobile-ff.graphql-client";
import {
  PaywallVisibility,
  RemoteConstantsDocument,
  type RemoteConstantsQuery,
  type RemoteConstantsQueryVariables,
} from "@firefliesai/mobile-ff.graphql-client";
import { getLocales } from "expo-localization";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apolloClient } from "@/graphql";
import { useAuth } from "../auth";
import { storage } from "../storage";

const remoteConstantsVariables = {
  os: Platform.OS,
  regionCode: getLocales()?.[0]?.regionCode ?? undefined,
};

const REMOTE_CONSTANTS_STORAGE_VERSION = 1;

const defaultRemoteConstants: RemoteConstants = {
  DEMO_MEETING_ID: "b1H42tdxM8",
  MAX_RECORDING_DURATION: 3.0 * 60 * 60 * 1000,
  SUPPORTED_LANGUAGES: [],
  PAYWALL_VISIBILITY: PaywallVisibility.Hidden,
  HIDE_PAID_FEATURES: true,
  VOICE_AGENT_BASE_URL: "https://agents.fireflies.ai",
};

type LegacyPaywallVisibility = "show" | "no-action" | "hidden";
type PersistedRemoteConstants = Partial<
  Omit<RemoteConstants, "PAYWALL_VISIBILITY">
> & {
  PAYWALL_VISIBILITY?:
    | RemoteConstants["PAYWALL_VISIBILITY"]
    | LegacyPaywallVisibility;
};

export const useRemoteConstants = create(
  persist<RemoteConstants>(() => defaultRemoteConstants, {
    name: "remote-constants",
    version: REMOTE_CONSTANTS_STORAGE_VERSION,
    storage: createJSONStorage(() => storage),
    migrate: (persistedState, version) => {
      if (version >= REMOTE_CONSTANTS_STORAGE_VERSION) {
        return persistedState as RemoteConstants;
      }

      return migrateRemoteConstants(persistedState);
    },
    onRehydrateStorage: () => {
      void refetchRemoteConstants();
    },
  }),
);

useAuth.subscribe((state, prevState) => {
  if (
    state.user &&
    (prevState.user?.id !== state.user.id ||
      prevState.user?.paidUser !== state.user.paidUser)
  ) {
    void refetchRemoteConstants();
  }
});

async function refetchRemoteConstants() {
  try {
    const { data } = await apolloClient.query<
      RemoteConstantsQuery,
      RemoteConstantsQueryVariables
    >({
      query: RemoteConstantsDocument,
      variables: remoteConstantsVariables,
      fetchPolicy: "network-only",
    });

    useRemoteConstants.setState(toRemoteConstants(data.remoteConstants));
  } catch {
    // Keep using the persisted or default constants.
  }
}

function migrateRemoteConstants(persistedState: unknown): RemoteConstants {
  if (typeof persistedState !== "object" || persistedState === null) {
    return defaultRemoteConstants;
  }

  const remoteConstants = persistedState as PersistedRemoteConstants;
  return {
    ...defaultRemoteConstants,
    ...remoteConstants,
    PAYWALL_VISIBILITY: migratePaywallVisibility(
      remoteConstants.PAYWALL_VISIBILITY,
    ),
  };
}

function toRemoteConstants(
  remoteConstants: RemoteConstantsQuery["remoteConstants"],
): RemoteConstants {
  return {
    DEMO_MEETING_ID: remoteConstants.DEMO_MEETING_ID,
    MAX_RECORDING_DURATION: remoteConstants.MAX_RECORDING_DURATION,
    SUPPORTED_LANGUAGES: remoteConstants.SUPPORTED_LANGUAGES.map((lang) => ({
      name: lang.name,
      code: lang.code,
    })),
    PAYWALL_VISIBILITY: remoteConstants.PAYWALL_VISIBILITY,
    HIDE_PAID_FEATURES: remoteConstants.HIDE_PAID_FEATURES,
    VOICE_AGENT_BASE_URL: remoteConstants.VOICE_AGENT_BASE_URL,
  };
}

function migratePaywallVisibility(
  visibility: PersistedRemoteConstants["PAYWALL_VISIBILITY"],
): PaywallVisibility {
  switch (visibility) {
    case PaywallVisibility.Show:
    case "show":
      return PaywallVisibility.Show;
    case PaywallVisibility.NoAction:
    case "no-action":
      return PaywallVisibility.NoAction;
    case PaywallVisibility.Hidden:
    case "hidden":
      return PaywallVisibility.Hidden;
    default:
      return defaultRemoteConstants.PAYWALL_VISIBILITY;
  }
}

import { getActualPlatform, isDesktop } from "@/utils/device";
import * as Application from "expo-application";
import { TurboModuleRegistry } from "react-native";

function assert<T>(key: string, value: T | undefined | null): value is T {
  if (value === undefined || value === null || Number.isNaN(value)) {
    throw new Error(`Invalid config value for key "${key}"`);
  }
  return true;
}

const ConfigInput = {
  NAME: "mobile",
  APP_NAME: `${Application.applicationId || (isDesktop ? "desktop" : "mobile")} (${getActualPlatform()})`,
  // Desktop first: this runs as web, where expo-application has no native
  // version to report, so the fallback below would leave every desktop build
  // claiming "0.0.0". The bridge is read here rather than at each call site so
  // a future reader cannot reintroduce that. Safe at module scope — the main
  // process registers its IPC handlers before any window exists.
  VERSION:
    window?.electron?.appVersion ||
    Application.nativeApplicationVersion ||
    "0.0.0",
  BUILD_NUMBER: Application.nativeBuildVersion || "0",
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV as
    | "preview"
    | "production"
    | "development",
  GRAPHQL_URL: process.env.EXPO_PUBLIC_GRAPHQL_URL,
  DASHBOARD_URL: process.env.EXPO_PUBLIC_DASHBOARD_URL,
  DOWNLOAD_URL: process.env.EXPO_PUBLIC_DOWNLOAD_URL,
  USER_SERVICE_URL: process.env.EXPO_PUBLIC_USER_SERVICE_URL,
  MOBILE_APP_URL: process.env.EXPO_PUBLIC_MOBILE_APP_URL,
  // Prefer EXPO_PUBLIC_DICTATION_URL; fall back so missing local/1Password values
  // do not crash the app at startup.
  DICTATION_URL:
    process.env.EXPO_PUBLIC_DICTATION_URL ||
    (process.env.EXPO_PUBLIC_APP_ENV === "production"
      ? "https://dictation.fireflies.ai"
      : "https://dictation.fireflies.dev"),
  LANDING_URL: process.env.EXPO_PUBLIC_LANDING_URL,
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  SEGMENT_WRITE_KEY: process.env.EXPO_PUBLIC_SEGMENT_WRITE_KEY,
  REALTIME_FF_HOST_WS: process.env.EXPO_PUBLIC_REALTIME_FF_HOST_WS,
  REALTIME_FF_STREAMING_HOST_WS:
    process.env.EXPO_PUBLIC_REALTIME_FF_STREAMING_HOST_WS,
  FRED_SERVICE_URL: process.env.EXPO_PUBLIC_FRED_SERVICE_URL,
  EXTERNAL_APPS_SERVICE_URL: process.env.EXPO_PUBLIC_EXTERNAL_APPS_SERVICE_URL,
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};

for (const envKey of Object.keys(ConfigInput)) {
  assert(envKey, ConfigInput[envKey as keyof typeof ConfigInput]);
}

// Skip metro proxy on desktop — Electron provides its own origin, not the metro bundler
if (__DEV__ && !isDesktop) {
  function getMetroOrigin() {
    const locationOrigin =
      typeof globalThis !== "undefined" &&
      typeof (globalThis as { location?: { origin?: string } }).location
        ?.origin === "string"
        ? (globalThis as { location?: { origin?: string } }).location?.origin
        : undefined;

    if (locationOrigin) {
      return locationOrigin;
    }

    const constants =
      TurboModuleRegistry.getEnforcing("PlatformConstants").getConstants?.();
    let scriptURL: string | undefined;

    if (
      constants &&
      "scriptURL" in constants &&
      typeof constants.scriptURL === "string"
    ) {
      scriptURL = constants.scriptURL;
    }

    if (!scriptURL) {
      return undefined;
    }

    try {
      return new URL(scriptURL).origin;
    } catch {
      return undefined;
    }
  }
  const metroOrigin = getMetroOrigin();
  if (metroOrigin) {
    ConfigInput.GRAPHQL_URL = `${metroOrigin}/graphql`;
    ConfigInput.DOWNLOAD_URL = `${metroOrigin}/download`;
    ConfigInput.USER_SERVICE_URL = `${metroOrigin}/user-service-rest`;
  }
}

export const Config = ConfigInput as {
  [key in keyof typeof ConfigInput]: NonNullable<(typeof ConfigInput)[key]>;
};

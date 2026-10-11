import { FredClient } from "@firefliesai/fred-client";
import { Platform } from "react-native";
import { Config } from "@/constants";
import { useAuth } from "@/features/auth";
import { getActualPlatform } from "@/utils/device";
// Use expo's fetch for React Native compatibility, native fetch for web/electron
import { fetch as expoFetch } from "expo/fetch";

// Module-level singleton to prevent duplicate clients and event-stream consumers
let fredClientInstance: FredClient | null = null;

export const createFredClient = (): FredClient => {
  // Return existing instance if already created
  if (fredClientInstance) {
    return fredClientInstance;
  }

  // Create new instance with preserved configuration
  fredClientInstance = new FredClient({
    baseUrl: Config.FRED_SERVICE_URL,
    bearerAuth: () => {
      // Access the auth store directly without using the hook
      const currentTokens = useAuth.getState().tokens;
      return currentTokens?.accessToken || "";
    },
    // Cookie auth only on real mobile web (m.fireflies.ai), where sign-in
    // leaves a `.fireflies.ai` `authorization` cookie that fred-service
    // accepts — "include" attaches it and lets the client send header-less.
    // getActualPlatform, not Platform.OS: Electron also reports "web" but has
    // bearer tokens and a non-fireflies origin, where "include" would be
    // answered with Access-Control-Allow-Origin: * and blocked.
    credentials: getActualPlatform() === "web" ? "include" : undefined,
    // Use native fetch for web/electron, expo fetch for React Native
    fetch: (Platform.OS === "web"
      ? fetch.bind(globalThis)
      : expoFetch) as typeof globalThis.fetch,
  });

  return fredClientInstance;
};

/**
 * Reset the FredClient singleton.
 * Call this when meeting ends to clear any stuck state.
 * Next call to createFredClient() will create a fresh instance.
 */
export const resetFredClient = (): void => {
  fredClientInstance = null;
};

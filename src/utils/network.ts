import { Logger } from "@/logger";
import {
  addNetworkStateListener as expoAddNetworkStateListener,
  getNetworkStateAsync as expoGetNetworkStateAsync,
  useNetworkState as useExpoNetworkState,
  NetworkStateType,
  type NetworkState,
} from "expo-network";

/**
 * DEV ONLY — flip to true to simulate airplane mode without touching Wi-Fi
 * (Metro/Expo keeps working). Fakes the device network state everywhere AND
 * points GraphQL at a dead host so requests fail like real offline.
 * Never commit `true`.
 */
export const DEV_FORCE_OFFLINE: boolean = false;

if (DEV_FORCE_OFFLINE) {
  new Logger("network").warn("DEV_FORCE_OFFLINE is ON — simulating offline");
}

const OFFLINE_STATE: NetworkState = {
  type: NetworkStateType.NONE,
  isConnected: false,
  isInternetReachable: false,
};

// Always read connectivity through this module, never from expo-network
// directly — otherwise DEV_FORCE_OFFLINE can't see it.
export { NetworkStateType, type NetworkState };

export function useNetworkState(): NetworkState {
  const state = useExpoNetworkState();
  return DEV_FORCE_OFFLINE ? OFFLINE_STATE : state;
}

export async function getNetworkStateAsync(): Promise<NetworkState> {
  return DEV_FORCE_OFFLINE ? OFFLINE_STATE : expoGetNetworkStateAsync();
}

export function addNetworkStateListener(
  listener: (state: NetworkState) => void,
) {
  return expoAddNetworkStateListener((state) =>
    listener(DEV_FORCE_OFFLINE ? OFFLINE_STATE : state),
  );
}

/** True only when the OS reports no reachable internet (e.g. airplane mode). */
export async function isOffline(): Promise<boolean> {
  return (await getNetworkStateAsync()).isInternetReachable === false;
}

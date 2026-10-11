import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AiPinRecordingEvent, AiPinStatus } from "@/modules/ai-pin";
import type { AiPinControllerState } from "./types";
import { PermissionsAndroid, Platform, type Permission } from "react-native";

const TRUSTED_DEVICE_PREFIX = "@fireflies/ai-pin/trusted-device";
const RECONNECT_BASE_MS = 15_000;
const RECONNECT_MAX_MS = 5 * 60_000;
const TRANSFER_ERROR_CODES = new Set([
  "contract_mismatch",
  "download_timeout",
  "file_commit_failed",
  "file_open_failed",
  "file_write_failed",
  "insufficient_storage",
  "invalid_file",
  "invalid_mp3",
  "invalid_size",
  "invalid_state",
  "write_failed",
]);

export interface TrustedDevice {
  id: string;
  serial?: string;
}

export const isAiPinTransferError = (code: string) =>
  TRANSFER_ERROR_CODES.has(code);

export function nextReconnect(failures: number) {
  const count = failures + 1;
  return {
    failures: count,
    nextAt:
      Date.now() +
      Math.min(RECONNECT_BASE_MS * 2 ** (count - 1), RECONNECT_MAX_MS),
  };
}

export function connectedStateFromStatus(
  status: AiPinStatus,
  durationMillis = 0,
): Pick<
  AiPinControllerState,
  "connectionState" | "serial" | "batteryLevel" | "recording"
> {
  const recording: AiPinRecordingEvent | undefined = status.recording
    ? {
        active: true,
        filename: status.recordingFilename,
        durationMillis,
        liveBytes: status.liveBytes,
      }
    : undefined;
  return {
    connectionState: "connected",
    serial: status.serial,
    batteryLevel: status.batteryLevel,
    recording,
  };
}

const trustedKey = (userId: string) =>
  `${TRUSTED_DEVICE_PREFIX}/${encodeURIComponent(userId)}`;

function parseTrustedDevice(value: string | null): TrustedDevice | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<TrustedDevice>;
    if (
      typeof parsed.id === "string" &&
      (!parsed.serial || /^[A-Z0-9]{15}$/.test(parsed.serial))
    ) {
      return { id: parsed.id, serial: parsed.serial };
    }
  } catch {
    // Invalid local state is discarded below.
  }
  return undefined;
}

export async function loadTrustedDevice(userId: string) {
  const key = trustedKey(userId);
  const stored = await AsyncStorage.getItem(key);
  const trusted = parseTrustedDevice(stored);
  if (stored && !trusted) await AsyncStorage.removeItem(key);
  return trusted;
}

export const saveTrustedDevice = (userId: string, device: TrustedDevice) =>
  AsyncStorage.setItem(trustedKey(userId), JSON.stringify(device));

export const removeTrustedDevice = (userId: string) =>
  AsyncStorage.removeItem(trustedKey(userId));

export async function requestNearbyPermission() {
  // CoreBluetooth owns the system permission prompt on iOS. Creating the
  // native central manager during startScan() requests access when needed.
  if (Platform.OS === "ios") return true;
  if (Platform.OS !== "android") return false;
  const permissions: Permission[] =
    Number(Platform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every(
    (permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}

import { isPseudoDeviceId } from "@/utils/audio-devices";

/**
 * The microphone dictation records through. Chromium device ids are per-app
 * hashes that can stop resolving (permission reset, profile change), so the
 * name and hardware group are kept alongside to find the same mic again.
 * All three empty means "follow the system default".
 */
export interface DictationMicrophoneSelection {
  deviceId: string;
  label: string;
  groupId: string;
}

export const SYSTEM_DEFAULT_MICROPHONE: DictationMicrophoneSelection = {
  deviceId: "",
  label: "",
  groupId: "",
};

export const isSystemDefaultMicrophone = (deviceId?: string) =>
  !deviceId?.trim();

export const normalizeDictationMicrophoneSelection = (
  value: Partial<DictationMicrophoneSelection> | null | undefined,
): DictationMicrophoneSelection => {
  const deviceId = value?.deviceId?.trim() ?? "";
  // Pinning Chromium's default pseudo-id follows whatever macOS makes the
  // default (AirPods the moment they connect), so it means "system default".
  if (!deviceId || isPseudoDeviceId(deviceId)) {
    return SYSTEM_DEFAULT_MICROPHONE;
  }
  return {
    deviceId,
    label: value?.label?.trim() ?? "",
    groupId: value?.groupId?.trim() ?? "",
  };
};

import {
  SYSTEM_DEFAULT_MICROPHONE,
  useLocalSettings,
  type DictationMicrophoneSelection,
} from "@/features/settings";
import { useCallback } from "react";
import type { DictationMicrophoneOption } from "./dictationMicrophone";
import {
  microphoneDisplayName,
  resolveDictationMicrophone,
} from "./dictationMicrophoneIdentity";
import { useDictationMicrophones } from "./useDictationMicrophones";

export interface DictationMicrophoneSelectionState {
  selection: DictationMicrophoneSelection;
  devices: DictationMicrophoneOption[];
  /** Name of the mic the system default resolves to right now, if known. */
  systemDefaultLabel: string;
  status: string;
  /**
   * Id of the list entry to show as selected: the saved mic under whatever id
   * it has today, or the saved id itself when it is not connected.
   */
  selectedDeviceId: string;
  /** True when a specific mic is saved but is not connected right now. */
  savedMicrophoneMissing: boolean;
  /** What to call the saved mic in copy while it is missing. */
  savedMicrophoneName: string;
  selectDevice: (device: DictationMicrophoneOption) => void;
  selectDeviceId: (deviceId: string) => void;
}

/**
 * The one place the settings screen and the onboarding meter read and write
 * the dictation microphone, so both agree on which entry is selected and on
 * what to say when the saved mic is unplugged.
 */
export function useDictationMicrophoneSelection(): DictationMicrophoneSelectionState {
  const selection = useLocalSettings((state) => state.dictationMicrophone);
  const setDictationMicrophone = useLocalSettings(
    (state) => state.setDictationMicrophone,
  );
  const { devices, systemDefaultLabel, status } = useDictationMicrophones();

  const resolved = resolveDictationMicrophone(selection, devices);
  const selectedDeviceId = resolved?.option.deviceId ?? selection.deviceId;
  const savedMicrophoneMissing = Boolean(selection.deviceId) && !resolved;
  const savedMicrophoneName =
    microphoneDisplayName(selection.label) || "Saved microphone";

  const selectDevice = useCallback(
    (device: DictationMicrophoneOption) => {
      setDictationMicrophone(
        device.deviceId ? device : SYSTEM_DEFAULT_MICROPHONE,
      );
    },
    [setDictationMicrophone],
  );

  const selectDeviceId = useCallback(
    (deviceId: string) => {
      // Re-picking the unplugged saved mic keeps it saved.
      if (deviceId === selection.deviceId) return;
      const device = devices.find((d) => d.deviceId === deviceId);
      setDictationMicrophone(device ?? SYSTEM_DEFAULT_MICROPHONE);
    },
    [devices, selection.deviceId, setDictationMicrophone],
  );

  return {
    selection,
    devices,
    systemDefaultLabel,
    status,
    selectedDeviceId,
    savedMicrophoneMissing,
    savedMicrophoneName,
    selectDevice,
    selectDeviceId,
  };
}

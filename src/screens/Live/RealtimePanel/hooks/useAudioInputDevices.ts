import { useRecordPreferencesStore } from "@/features/live-record/record-preference.store";
import { useCallback, useEffect, useState } from "react";

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

interface UseAudioInputDevicesResult {
  devices: AudioInputDevice[];
  selectedDeviceId: string | null;
  selectDevice: (deviceId: string) => void;
  currentLabel: string;
}

const DEFAULT_LABEL = "Default";

const getMediaDevices = (): MediaDevices | undefined => {
  if (typeof navigator === "undefined") return undefined;
  return navigator.mediaDevices;
};

const labelForIndex = (index: number) => `Microphone ${index + 1}`;

// Browsers prefix the system-default device with "Default - "; drop it for the
// compact pill label so it reads like the device name shown in the design.
const cleanLabel = (label: string) => label.replace(/^Default\s*-\s*/i, "");

/**
 * Enumerates audio input devices and persists the chosen one. Selecting a
 * device switches the live recording immediately and is also applied on the
 * next recording start.
 */
export function useAudioInputDevices(): UseAudioInputDevicesResult {
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const selectedDeviceId = useRecordPreferencesStore(
    (state) => state.audioInputDeviceId,
  );
  const setAudioInputDeviceId = useRecordPreferencesStore(
    (state) => state.setAudioInputDeviceId,
  );

  const refreshDevices = useCallback(async () => {
    const mediaDevices = getMediaDevices();
    if (!mediaDevices?.enumerateDevices) return;

    const all = await mediaDevices.enumerateDevices();
    const inputs = all
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || labelForIndex(index),
      }));
    setDevices(inputs);
  }, []);

  useEffect(() => {
    const mediaDevices = getMediaDevices();
    if (!mediaDevices) return;

    refreshDevices();
    mediaDevices.addEventListener?.("devicechange", refreshDevices);
    return () => {
      mediaDevices.removeEventListener?.("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  const selectDevice = useCallback(
    (deviceId: string) => {
      setAudioInputDeviceId(deviceId);
      // The recorder runs in another window on desktop, so route the live
      // switch through the recording-context bridge. The persisted value above
      // is applied on the next recording start.
      window.electron?.recordingContext?.setInputDevice(deviceId);
    },
    [setAudioInputDeviceId],
  );

  const selectedDevice = devices.find(
    (device) => device.deviceId === selectedDeviceId,
  );
  const currentLabel = cleanLabel(
    selectedDevice?.label ?? devices[0]?.label ?? DEFAULT_LABEL,
  );

  return { devices, selectedDeviceId, selectDevice, currentLabel };
}

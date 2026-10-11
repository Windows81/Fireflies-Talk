import { useCallback, useEffect, useRef, useState } from "react";
import {
  listDictationMicrophoneInventory,
  type DictationMicrophoneOption,
} from "./dictationMicrophone";

export function useDictationMicrophones() {
  const [devices, setDevices] = useState<DictationMicrophoneOption[]>([]);
  const [systemDefaultLabel, setSystemDefaultLabel] = useState("");
  const [status, setStatus] = useState("");
  // Hot-plug bursts overlap refreshes; only the latest one may write state.
  const refreshGenerationRef = useRef(0);

  const refresh = useCallback(async () => {
    const generation = ++refreshGenerationRef.current;
    const isCurrent = () => generation === refreshGenerationRef.current;
    try {
      const inventory = await listDictationMicrophoneInventory();
      if (!isCurrent()) return;
      setDevices(inventory.devices);
      setSystemDefaultLabel(inventory.systemDefaultLabel);
      setStatus(
        inventory.devices.length > 0
          ? ""
          : "No microphones found. Connect a device and try again.",
      );
    } catch (error) {
      if (!isCurrent()) return;
      setStatus(
        error instanceof Error ? error.message : "Could not list microphones.",
      );
    }
  }, []);

  useEffect(() => {
    void refresh();

    const mediaDevices =
      typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!mediaDevices?.addEventListener) {
      return;
    }

    const handleDeviceChange = () => {
      void refresh();
    };
    mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refresh]);

  return { devices, systemDefaultLabel, status, refresh };
}

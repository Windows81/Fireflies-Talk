import { useFeatureIsOn } from "@/features/feature-flags";
import { isDesktop } from "@/utils/device";
import { FEATURE_FLAGS } from "../feature-flags";

export const useWindowsLoopbackAllDevices = (): boolean => {
  const enabled = useFeatureIsOn(
    FEATURE_FLAGS.DESKTOP_WINDOWS_LOOPBACK_ALL_DEVICES,
  );
  return isDesktop && enabled;
};

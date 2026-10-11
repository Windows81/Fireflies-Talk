import { Config } from "@/constants";
import { useFeatureValue } from "@/features/feature-flags";
import { compareVersions } from "@/utils/updates";
import { Platform } from "react-native";
import { isDesktop } from "@/utils/device";

type MinVersionFlag = {
  ios: string;
  android: string;
} | null;

export const useForceUpdate = (): boolean => {
  const minVersions = useFeatureValue<MinVersionFlag>(
    "mobile-ff.minimum-supported-app-version",
    null,
  );

  // Force update screen is only for mobile apps
  if (Platform.OS === "web" || isDesktop) return false;

  // If the flag could not be loaded, return false;
  if (!minVersions) return false;

  const { android, ios } = minVersions || {};
  const minVersion = Platform.select({
    ios,
    android,
  });

  // If no version specified for the platform, return false
  if (!minVersion) return false;

  return compareVersions(Config.VERSION, minVersion) === -1;
};

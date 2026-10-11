import { nativeApplicationVersion } from "expo-application";
import * as Updates from "expo-updates";
import { isDesktop } from "@/utils/device";

/**
 * Formats the OTA update identifier using createdAt timestamp and a short updateId suffix.
 * Format: MMddHHmm-xxxx (e.g., "01151430-a1b2" for Jan 15 at 14:30 UTC, with last 4 chars of updateId)
 */
export const formatOtaIdentifier = (): string | null => {
  const { createdAt, updateId } = Updates;

  if (!createdAt) {
    // Native build without OTA updates pushed.
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStamp = [
    pad(createdAt.getUTCMonth() + 1),
    pad(createdAt.getUTCDate()),
    pad(createdAt.getUTCHours()),
    pad(createdAt.getUTCMinutes()),
  ].join("");

  // Get the last 4 characters of the Expo updateId
  const idSuffix = updateId?.slice(-4) ?? "";
  return idSuffix ? `${dateStamp}-${idSuffix}` : dateStamp;
};

/**
 * Hook that returns the current app version string combining the native version and OTA identifier.
 * @returns {string} The complete version string in format "vX.Y.Z" or "vX.Y.Z.MMDDHHmm-xxxx"
 *
 * Examples:
 * - Native version only: "v1.2.3"
 * - With OTA update: "v1.2.3.03220015-a1b2" (OTA created Mar 22 at 00:15 UTC)
 */
export const getAppVersion = (): string => {
  const otaIdentifier = formatOtaIdentifier();
  return otaIdentifier
    ? `${nativeApplicationVersion}.${otaIdentifier}`
    : `${nativeApplicationVersion}`;
};

/**
 * Resolves the version of the running client: the Electron app version on
 * desktop (where the native/OTA version is not available), otherwise the
 * native + OTA version. Returns undefined on web, which has no native version.
 */
export const resolveClientAppVersion = async (): Promise<
  string | undefined
> => {
  if (isDesktop) {
    const desktopVersion = await window.electron?.updater
      ?.getVersion()
      .catch(() => null);

    if (desktopVersion) return desktopVersion;
  }

  return nativeApplicationVersion ? getAppVersion() : undefined;
};

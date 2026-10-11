import { useVirtualCameraStatus } from "@/features/camera-consent";
import { useLocalSettings } from "@/features/settings";
import { useRecordingPreferencesQuery } from "@/graphql";
import { getActualPlatform } from "@/utils/device";
import type { ConsentSnapshot } from "./consentTracking";

/**
 * What all three consent channels are currently set to, so a toggle on any one
 * of them can report the whole picture instead of only the row that changed.
 *
 * Each channel keeps the same source of truth it is edited through: a local
 * setting for the spoken message, the installed device for the camera notice,
 * and the account for the chat notice.
 */
export function useConsentSnapshot(): ConsentSnapshot {
  const audio = useLocalSettings((state) => state.audioConsentEnabled);
  const { status: cameraStatus } = useVirtualCameraStatus();
  // Read-through: whichever consent surface is on screen has already asked for
  // this, and a snapshot is not a reason to go to the network again.
  const { data } = useRecordingPreferencesQuery({ fetchPolicy: "cache-first" });

  const chatSupported = getActualPlatform() === "darwin";

  return {
    audio,
    // Null while the first status is still in flight as well as on a platform
    // with no camera bridge; both mean "we cannot claim a value".
    camera: cameraStatus?.supported ? cameraStatus.installed : null,
    chat: chatSupported
      ? (data?.recordingPreferences?.teamsConsentEnabled ?? false)
      : null,
  };
}

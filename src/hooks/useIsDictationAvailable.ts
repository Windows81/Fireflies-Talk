import { getActualPlatform } from "@/utils/device";
import { isDictationAvailable } from "./dictationAvailability";
import { useDictationTalkPolicy } from "./useDictationTalkPolicy";
import { useIsDictationFlagOn } from "./useIsDictationFlagOn";

/** Whether Fireflies Talk, and the surfaces it brought, exist for this user here. */
export function useIsDictationAvailable(): boolean {
  const flagOn = useIsDictationFlagOn();
  const { disabledByUser, disabledByTeam, isTeamAdmin, resolved } =
    useDictationTalkPolicy();

  return isDictationAvailable({
    flagOn,
    platform: getActualPlatform(),
    disabledByUser,
    disabledByTeam,
    isTeamAdmin,
    policyResolved: resolved,
  });
}

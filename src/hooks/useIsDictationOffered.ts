import { getActualPlatform } from "@/utils/device";
import { isDictationOffered } from "./dictationAvailability";
import { useDictationTalkPolicy } from "./useDictationTalkPolicy";
import { useIsDictationFlagOn } from "./useIsDictationFlagOn";

/** Whether Fireflies Talk is offered on this device, on or off state aside. */
export function useIsDictationOffered(): boolean {
  const flagOn = useIsDictationFlagOn();
  const { resolved } = useDictationTalkPolicy();

  return isDictationOffered({
    flagOn,
    platform: getActualPlatform(),
    policyResolved: resolved,
  });
}

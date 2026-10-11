import { useEffect, useState } from "react";
import { getActualPlatformFriendly } from "@/utils/device";
import { resolveClientAppVersion } from "@/utils/version";

export interface FeedbackClientInfo {
  appVersion?: string;
  os: string;
}

/**
 * Client metadata sent along with feedback so Slack notifications show which
 * app version and platform the feedback came from. The version is resolved
 * upfront (it needs an IPC round-trip on desktop) so submit handlers stay sync.
 */
export const useFeedbackClientInfo = (): FeedbackClientInfo => {
  const [appVersion, setAppVersion] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    resolveClientAppVersion().then((version) => {
      if (!cancelled) setAppVersion(version);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { appVersion, os: getActualPlatformFriendly() };
};

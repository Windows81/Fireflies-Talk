import { DASHBOARD_NOTEBOOK_URL } from "@/constants/links";
import {
  startUpgradeFlow,
  useBilling,
  usePaywallConfig,
} from "@/features/billing";
import { openURL } from "@/features/navigation";
import { trackPaywallShown } from "@/features/paywall";
import { PaywallVisibility } from "@firefliesai/mobile-ff.graphql-client";
import { useEffect, type FC } from "react";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { isRecordedAfterStorageLimit } from "./storageLock";
import { StoragePaywallOverlay } from "./StoragePaywallOverlay";

const PWL = "desktop_notepad-storage";

/**
 * Blocks the notepad while the team is over its storage limit, but only for
 * meetings recorded after it ran over. Renders nothing until billing data
 * confirms the limit is hit, so the notepad never flashes a takeover on a cold
 * cache.
 */
export const StoragePaywall: FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { meeting } = useDesktopNotepadContext();
  const { reachedTeamMinutesConsumedLimit, teamMinutesConsumed } = useBilling();
  const { visibility } = usePaywallConfig();

  const isBlocked =
    reachedTeamMinutesConsumedLimit &&
    isRecordedAfterStorageLimit(
      meeting,
      teamMinutesConsumed?.storageLimitHitDate,
    ) &&
    visibility !== PaywallVisibility.Hidden;

  useEffect(() => {
    if (!isBlocked) return;
    trackPaywallShown({ paywall: "storage", from: "desktop-notepad" });
  }, [isBlocked]);

  const consumedMinutes = teamMinutesConsumed?.minutesConsumed;
  const limitMinutes = teamMinutesConsumed?.tierLimit;

  if (!isBlocked || consumedMinutes == null || limitMinutes == null) {
    return null;
  }

  return (
    <StoragePaywallOverlay
      consumedMinutes={consumedMinutes}
      limitMinutes={limitMinutes}
      showUpgrade={visibility === PaywallVisibility.Show}
      onUpgrade={() => startUpgradeFlow({ pwl: PWL })}
      // Deleting meetings is only possible on the dashboard notebook, which is
      // what the card asks the user to do.
      onReviewMeetings={() => openURL(DASHBOARD_NOTEBOOK_URL)}
      onBack={onBack}
    />
  );
};

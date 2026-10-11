import { InAppPaywallModal } from "@/components/Paywall";
import { trackPaywallShown } from "@/features/paywall";
import { Tier } from "@firefliesai/payments-ff.utils";
import type { FC } from "react";
import { globalModalsApi } from "../global-modals.store";

export const DOWNLOAD_PAYWALL_MODAL_NAME = "download-paywall-modal";

export const DownloadPaywallModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  return (
    <InAppPaywallModal
      title="Upgrade to Download Meetings"
      pwl="mobile_download"
      onClose={close}
      onUpgradePress={close}
      isOpen={isOpen}
      minTier={Tier.PRO}
    />
  );
};

export const openDownloadPaywallModal = (fromRef: string) => {
  globalModalsApi.openModal(DOWNLOAD_PAYWALL_MODAL_NAME);

  trackPaywallShown({
    paywall: "download",
    from: fromRef,
  });
};

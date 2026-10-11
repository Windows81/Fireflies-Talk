import { InAppPaywallModal } from "@/components/Paywall";
import { trackPaywallShown } from "@/features/paywall";
import { Tier } from "@firefliesai/payments-ff.utils";
import type { FC } from "react";
import { globalModalsApi } from "../global-modals.store";

export const STORAGE_PAYWALL_MODAL_NAME = "storage-paywall-modal";

export const StoragePaywallModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  return (
    <InAppPaywallModal
      title="Upgrade to Get More Storage"
      description="You have exhausted your storage. To continue viewing your new meetings upgrade."
      isOpen={isOpen}
      onClose={close}
      onUpgradePress={close}
      pwl="mobile_storage"
      minTier={Tier.PRO}
    />
  );
};

export const openStoragePaywallModal = (fromRef: string) => {
  globalModalsApi.openModal(STORAGE_PAYWALL_MODAL_NAME);

  trackPaywallShown({
    paywall: "storage",
    from: fromRef,
  });
};

import { InAppPaywallModal } from "@/components/Paywall";
import { trackPaywallShown } from "@/features/paywall";
import { Tier } from "@firefliesai/payments-ff.utils";
import type { FC } from "react";
import { globalModalsApi } from "../global-modals.store";

export const SMART_SEARCH_PAYWALL_MODAL_NAME = "smart-search-paywall-modal";

export const SmartSearchPaywallModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  return (
    <InAppPaywallModal
      title="Upgrade to Access Smart Search"
      description="Filter action items, tasks, questions and other key metrics from your meetings."
      isOpen={isOpen}
      onClose={close}
      onUpgradePress={close}
      pwl="mobile_smart-search"
      minTier={Tier.PRO}
    />
  );
};

export const openSmartSearchPaywallModal = (fromRef: string) => {
  globalModalsApi.openModal(SMART_SEARCH_PAYWALL_MODAL_NAME);

  trackPaywallShown({
    paywall: "smart-search",
    from: fromRef,
  });
};

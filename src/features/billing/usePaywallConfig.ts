import { useRemoteConstants } from "../remote-constants";

export const usePaywallConfig = () => {
  const {
    PAYWALL_VISIBILITY: visibility,
    HIDE_PAID_FEATURES: hidePaidFeatures,
  } = useRemoteConstants();

  return {
    visibility,
    hidePaidFeatures,
  };
};

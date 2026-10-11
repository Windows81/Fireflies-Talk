import { Tier } from "@firefliesai/payments-ff.utils";
import { getUserTier } from "@/utils/user";
import { useAuth } from "../auth";

export const useShouldShowUnlimitedRecordingCampaign = () => {
  const { user } = useAuth();

  if (!user) return true;

  return getUserTier(user) === Tier.FREE;
};

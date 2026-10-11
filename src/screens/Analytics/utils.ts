import { useAuth } from "@/features/auth";
import { isMinBusinessUser } from "@firefliesai/payments-ff.utils";

export const useCanAccessAnalytics = () => {
  const { user } = useAuth();

  if (!user) return false;

  return isMinBusinessUser(user.paidUser);
};

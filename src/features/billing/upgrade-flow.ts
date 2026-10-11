import { RouteNames } from "@/constants";
import { RootNavigation } from "@/screens/RootNavigation";

export const startUpgradeFlow = ({
  pwl,
  forAskFred = false,
}: {
  pwl?: string;
  forAskFred?: boolean;
} = {}) => {
  const params = new URLSearchParams();
  if (pwl) params.set("pwl", pwl);
  if (forAskFred) params.set("af", "true");
  const queryParams = params.toString() ? `?${params.toString()}` : "";
  RootNavigation.navigate(RouteNames.Upgrade, { query: queryParams });
};

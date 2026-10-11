import { RouteNames } from "@/constants";
import type { StackRouteConfig } from "../types";
import { DesktopOnboardingScreen } from "./DesktopOnboardingScreen";

const DesktopOnboardingRouteConfig: StackRouteConfig<"DesktopOnboarding"> = {
  name: RouteNames.DesktopOnboarding,
  component: DesktopOnboardingScreen,
  options: {
    title: "Onboarding",
    headerShown: false,
  },
};

export default DesktopOnboardingRouteConfig;

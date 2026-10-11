import type { StackRouteConfig } from "../types";
import { IntroVideoScreen } from "./IntroVideoScreen";
import { OnboardingScreen } from "./OnboardingScreen";

const OnboardingRouteConfig: StackRouteConfig<"Onboarding"> = {
  name: "Onboarding",
  component: OnboardingScreen,
  options: {
    headerShown: false,
  },
};

const IntroVideoRouteConfig: StackRouteConfig<"IntroVideo"> = {
  name: "IntroVideo",
  component: IntroVideoScreen,
  options: {
    title: "Welcome",
    headerShown: false,
  },
};

export { OnboardingRedirectComponent } from "./OnboardingRedirectComponent";
export { IntroVideoRouteConfig };

export default OnboardingRouteConfig;

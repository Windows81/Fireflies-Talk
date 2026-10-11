import { RouteNames } from "@/constants";
import type { StackRouteConfig } from "../types";
import { MainDesktopScreen } from "./MainDesktopScreen";

const MainDesktopRouteConfig: StackRouteConfig<"MainDesktop"> = {
  name: RouteNames.MainDesktop,
  component: MainDesktopScreen,
  options: {
    title: "Home",
    headerShown: false,
  },
};

export default MainDesktopRouteConfig;

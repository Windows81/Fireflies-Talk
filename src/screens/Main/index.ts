import type { StackRouteConfig } from "../types";
import { MainScreen } from "./MainScreen";

const MainRouteConfig: StackRouteConfig<"Main"> = {
  name: "Main",
  component: MainScreen,
  options: {
    headerShown: false,
  },
};

export default MainRouteConfig;

import type { StackRouteConfig } from "../types";
import { ExtensionsScreen } from "./Extensions";

const ExtensionsRouteConfig: StackRouteConfig<"Extensions"> = {
  name: "Extensions",
  component: ExtensionsScreen,
  options: {
    title: "AI Skills",
  },
};

export default ExtensionsRouteConfig;

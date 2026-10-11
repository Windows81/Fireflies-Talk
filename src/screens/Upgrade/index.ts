import type { StackRouteConfig } from "../types";
import { UpgradeScreen } from "./UpgradeScreen";

const UpgradeRouteConfig: StackRouteConfig<"Upgrade"> = {
  name: "Upgrade",
  component: UpgradeScreen,
};

export default UpgradeRouteConfig;

import type { StackRouteConfig } from "../types";
import { SettingsScreen } from "./SettingsScreen";

const SettingsRouteConfig: StackRouteConfig<"Settings"> = {
  name: "Settings",
  component: SettingsScreen,
};

export default SettingsRouteConfig;

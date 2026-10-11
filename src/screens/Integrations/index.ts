import type { StackRouteConfig } from "../types";
import { IntegrationsScreen } from "./Integrations";

const IntegrationsRouteConfig: StackRouteConfig<"Integrations"> = {
  name: "Integrations",
  component: IntegrationsScreen,
};

export default IntegrationsRouteConfig;

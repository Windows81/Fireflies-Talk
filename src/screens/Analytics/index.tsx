import type { TabRouteConfig } from "../types";
import { AnalyticsScreen } from "./AnalyticsScreen";
import { HeaderRight } from "./components/Header";

const AnalyticsRouteConfig: TabRouteConfig<"Analytics"> = {
  name: "Analytics",
  component: AnalyticsScreen,
  options: {
    title: "Analytics",
    headerRight() {
      return <HeaderRight />;
    },
  },
};

export default AnalyticsRouteConfig;

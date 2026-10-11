import type { TabRouteConfig } from "../types";
import { HomeScreen } from "./HomeScreen";
import { HeaderGreeting } from "./components/HeaderGreeting";
import { HeaderLeft } from "./components/HeaderLeft";
import { HeaderRight } from "./components/HeaderRight";

const HomeRouteConfig: TabRouteConfig<"Home"> = {
  name: "Home",
  component: HomeScreen,
  options: {
    headerTitleAlign: "left",
    headerTitle: () => <HeaderGreeting />,
    headerLeft: () => <HeaderLeft />,
    headerRight: () => <HeaderRight />,
  },
};

export default HomeRouteConfig;

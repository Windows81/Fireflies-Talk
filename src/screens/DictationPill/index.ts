import type { StackRouteConfig } from "../types";
import { DictationPillScreen } from "./DictationPillScreen";

const DictationPillRouteConfig: StackRouteConfig<"DictationPill"> = {
  name: "DictationPill",
  component: DictationPillScreen,
  options: {
    headerShown: false,
    gestureEnabled: false,
    animation: "none",
    contentStyle: { backgroundColor: "transparent", overflow: "visible" },
  },
};

export default DictationPillRouteConfig;

import type { StackRouteConfig } from "../types";
import { LiveScreen } from "./LiveScreen";
import { isDesktop } from "@/utils/device";

const LiveRouteConfig: StackRouteConfig<"Live"> = {
  name: "Live",
  component: LiveScreen,
  options: {
    title: isDesktop ? "Live Assist" : "",
    // The unified live view renders its own app bar.
    headerShown: false,
  },
  getId({ params }) {
    return params.id;
  },
};

export default LiveRouteConfig;

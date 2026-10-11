import type { StackRouteConfig } from "../types";
import { MeetingStartingScreen } from "./MeetingStartingScreen";

const MeetingStartingRouteConfig: StackRouteConfig<"MeetingStarting"> = {
  name: "MeetingStarting",
  component: MeetingStartingScreen,
  options: {
    headerShown: false,
    gestureEnabled: false,
    animation: "none",
    animationTypeForReplace: "pop",
  },
};

export default MeetingStartingRouteConfig;

import type { StackRouteConfig } from "../types";
import { YouScreen } from "./YouScreen";

const YouRouteConfig: StackRouteConfig<"You"> = {
  name: "You",
  component: YouScreen,
  // Slide in from the left only when opened via the Home hamburger (top-left).
  // Every other entry point is the top-right avatar
  options: ({ route }) => ({
    title: "Profile",
    ...(route.params?.fromLeft && {
      animation: "slide_from_left",
    }),
  }),
};

export default YouRouteConfig;

export { YouHeaderButton } from "./YouHeaderButton";

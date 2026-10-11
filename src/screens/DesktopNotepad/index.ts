import { RouteNames } from "@/constants";
import type { StackRouteConfig } from "../types";
import { DesktopNotepadScreen } from "./DesktopNotepadScreen";

const DesktopNotepadRouteConfig: StackRouteConfig<"DesktopNotepad"> = {
  name: RouteNames.DesktopNotepad,
  component: DesktopNotepadScreen,
  options: {
    headerShown: false,
  },
  getId({ params }) {
    return params?.id;
  },
};

export default DesktopNotepadRouteConfig;

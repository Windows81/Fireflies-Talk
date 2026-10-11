import { RouteNames } from "@/constants";
import type { StackRouteConfig } from "../types";
import { DesktopSettingsScreen } from "./DesktopSettingsScreen";
import {
  DesktopSettingsHeaderTitle,
  DesktopSettingsHeaderRight,
} from "./components";
import { createElement } from "react";

const DesktopSettingsRouteConfig: StackRouteConfig<"DesktopSettings"> = {
  name: RouteNames.DesktopSettings,
  component: DesktopSettingsScreen,
  options: ({ navigation, route }) => {
    const activeContent = route.params?.activeContent || "meeting-preference";

    return {
      title: "Settings",
      headerTitle: () =>
        createElement(DesktopSettingsHeaderTitle, {
          activeContent,
          navigation,
        }),
      headerRight: () => createElement(DesktopSettingsHeaderRight, {}),
    };
  },
};

export default DesktopSettingsRouteConfig;

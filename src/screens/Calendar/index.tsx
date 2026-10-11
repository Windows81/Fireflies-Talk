import type { TabRouteConfig } from "../types";
import { CalendarScreen } from "./CalendarScreen";

const CalendarRouteConfig: TabRouteConfig<"Calendar"> = {
  name: "Calendar",
  component: CalendarScreen,
  options: {
    title: "Calendar",
  },
};

export default CalendarRouteConfig;

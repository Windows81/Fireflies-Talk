import type { StackRouteConfig, TabRouteConfig } from "../types";
import { HeaderRight } from "./components/HeaderRight";
import { MeetingStatusScreen } from "./MeetingStatusScreen";

const tabRouteOptions = {
  title: "Meeting Status",
  headerRight: () => <HeaderRight />,
};

export const MeetingStatusTabRouteConfig: TabRouteConfig<"MeetingStatus"> = {
  name: "MeetingStatus",
  component: MeetingStatusScreen,
  options: tabRouteOptions,
};

export const MeetingStatusRouteConfig: StackRouteConfig<"MeetingStatus"> = {
  name: "MeetingStatus",
  component: MeetingStatusScreen,
  options: {
    title: "Meeting Status",
  },
};

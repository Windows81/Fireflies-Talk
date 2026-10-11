import type { StackRouteConfig } from "../types";
import { TopicTrackerScreen } from "./TopicTrackerScreen";

const TopicTrackerRouteConfig: StackRouteConfig<"TopicTracker"> = {
  name: "TopicTracker",
  component: TopicTrackerScreen,
  options: {
    title: "Topic Tracker",
  },
};

export default TopicTrackerRouteConfig;

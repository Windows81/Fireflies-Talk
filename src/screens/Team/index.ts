import type { StackRouteConfig } from "../types";
import { TeamScreen } from "./TeamScreen";

const TeamRouteConfig: StackRouteConfig<"Team"> = {
  name: "Team",
  component: TeamScreen,
};

export default TeamRouteConfig;

import type { StackRouteConfig } from "../types";
import { DownloadsScreen } from "./DownloadsScreen";

const DownloadsRouteConfig: StackRouteConfig<"Downloads"> = {
  name: "Downloads",
  component: DownloadsScreen,
};

export default DownloadsRouteConfig;

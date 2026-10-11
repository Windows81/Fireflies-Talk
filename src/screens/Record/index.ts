import { isDesktop } from "@/utils/device";
import type { StackRouteConfig } from "../types";
import { RecordScreen } from "./RecordScreen";

const RecordRouteConfig: StackRouteConfig<"Record"> = {
  name: "Record",
  component: RecordScreen,
  options: {
    title: isDesktop ? "Capture" : "Record",
  },
};

export default RecordRouteConfig;

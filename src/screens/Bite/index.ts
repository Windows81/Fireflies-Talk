import type { StackRouteConfig } from "../types";
import { BiteScreen } from "./BiteScreen";

const BiteRouteConfig: StackRouteConfig<"Bite"> = {
  name: "Bite",
  component: BiteScreen,
  options: {
    title: "",
  },
  getId({ params }) {
    return params.id;
  },
};

export default BiteRouteConfig;

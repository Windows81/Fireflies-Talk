import type { StackRouteConfig } from "../types";
import { DiagnosticScreen } from "./DiagnosticScreen";

const DiagnosticRouteConfig: StackRouteConfig<"Diagnostic"> = {
  name: "Diagnostic",
  component: DiagnosticScreen,
  options: {
    title: "Diagnostic",
  },
};

export default DiagnosticRouteConfig;

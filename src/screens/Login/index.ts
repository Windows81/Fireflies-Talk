import type { StackRouteConfig } from "../types";
import { LoginScreen } from "./LoginScreen";

export const LoginRouteConfig: StackRouteConfig<"Login"> = {
  name: "Login",
  component: LoginScreen,
  options: {
    title: "Login",
    headerShown: false,
  },
  getId() {
    return "Login";
  },
};

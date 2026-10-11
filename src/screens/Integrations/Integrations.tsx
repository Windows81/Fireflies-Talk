import { DashboardWebview } from "@/features/legacy";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import type { ParamList } from "../types";

export const IntegrationsScreen: FC<
  NativeStackScreenProps<ParamList, "Integrations">
> = ({ route }) => {
  return <DashboardWebview path={route.path || "/integrations"} />;
};

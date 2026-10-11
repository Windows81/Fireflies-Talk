import { DashboardWebview } from "@/features/legacy";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import type { ParamList } from "../types";

export const TeamScreen: FC<NativeStackScreenProps<ParamList, "Team">> = ({
  route,
}) => {
  return <DashboardWebview path={route.path || "/team"} />;
};

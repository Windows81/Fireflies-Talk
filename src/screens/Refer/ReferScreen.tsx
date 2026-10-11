import { DashboardWebview } from "@/features/legacy";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import type { ParamList } from "../types";

export const ReferScreen: FC<NativeStackScreenProps<ParamList, "Refer">> = ({
  route,
}) => {
  return <DashboardWebview path={route.path || "/refer"} />;
};

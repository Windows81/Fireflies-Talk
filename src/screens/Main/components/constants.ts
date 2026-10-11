import {
  IconBarChart2,
  IconBookOpen,
  IconHome,
  IconMediaLibrary,
  IconPhoneCall,
  IconZap,
} from "@/assets/svg";
import { RouteNames } from "@/constants";
import type { FC } from "react";
import type { SvgProps } from "react-native-svg";
import { CalendarTabBarIcon } from "./CalendarTabBarIcon";

export const RouteIconMap: Record<string, FC<SvgProps>> = {
  [RouteNames.Home]: IconHome,
  [RouteNames.Notebook]: IconBookOpen,
  [RouteNames.Library]: IconMediaLibrary,
  [RouteNames.Analytics]: IconBarChart2,
  [RouteNames.Calendar]: CalendarTabBarIcon,
  [RouteNames.Phone]: IconPhoneCall,
  [RouteNames.MeetingStatus]: IconZap,
};

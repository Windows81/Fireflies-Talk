import {
  IconHash,
  IconMediaLibrary,
  IconSettings,
  IconUpload,
  IconZap,
} from "@/assets/svg";
import { Config, RouteNames } from "@/constants";
import type { FC } from "react";
import type { SvgProps } from "react-native-svg";

export interface SidebarItemDef {
  title: string;
  name: string;
  Icon: FC<SvgProps>;
  externalUrl?: string;
}

export const SECONDARY_ITEMS: SidebarItemDef[] = [
  { title: "Meeting Status", name: RouteNames.MeetingStatus, Icon: IconZap },
  { title: "Uploads", name: RouteNames.Upload, Icon: IconUpload },
  { title: "Library", name: RouteNames.Library, Icon: IconMediaLibrary },
  {
    title: "Topic Tracker",
    name: RouteNames.TopicTracker,
    Icon: IconHash,
    externalUrl: `${Config.DASHBOARD_URL}/topics`,
  },
];

export const FOOTER_ITEMS: SidebarItemDef[] = [
  {
    title: "Settings",
    name: RouteNames.Settings,
    Icon: IconSettings,
    externalUrl: `${Config.DASHBOARD_URL}/settings`,
  },
];

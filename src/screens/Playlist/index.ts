import type { StackRouteConfig } from "../types";
import { PlaylistScreen } from "./PlaylistScreen";

const PlaylistRouteConfig: StackRouteConfig<"Playlist"> = {
  name: "Playlist",
  component: PlaylistScreen,
  options: {
    title: "",
  },
  getId({ params }) {
    return params.id;
  },
};

export default PlaylistRouteConfig;

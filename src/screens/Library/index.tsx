import type { StackRouteConfig } from "../types";
import { LibraryScreen } from "./LibraryScreen";
import { HeaderRight } from "./components/Header";

const LibraryRouteConfig: StackRouteConfig<"Library"> = {
  name: "Library",
  component: LibraryScreen,
  options: {
    title: "Library",
    headerRight() {
      return <HeaderRight />;
    },
  },
};

export default LibraryRouteConfig;

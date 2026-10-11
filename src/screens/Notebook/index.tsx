import type { TabRouteConfig } from "../types";
import { NotebookScreen } from "./NotebookScreen";
import { HeaderRight } from "./components/Header";

const NotebookRouteConfig: TabRouteConfig<"Notebook"> = {
  name: "Notebook",
  component: NotebookScreen,
  options: {
    title: "Notebook",
    headerRight() {
      return <HeaderRight />;
    },
  },
};

export default NotebookRouteConfig;

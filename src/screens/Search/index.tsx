import type { StackRouteConfig } from "../types";
import { SearchScreen } from "./SearchScreen";

const SearchRouteConfig: StackRouteConfig<"Search"> = {
  name: "Search",
  component: SearchScreen,
  options: {
    title: "Search",
    headerShown: false,
  },
};

export default SearchRouteConfig;

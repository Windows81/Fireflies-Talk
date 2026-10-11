import type { StackRouteConfig } from "../types";
import { NotepadScreen } from "./NotepadScreen";

const NotepadRouteConfig: StackRouteConfig<"Notepad"> = {
  name: "Notepad",
  component: NotepadScreen,
  options: {
    title: "",
  },
  getId({ params }) {
    return params?.id;
  },
};

export default NotepadRouteConfig;

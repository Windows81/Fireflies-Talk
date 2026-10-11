import type { CoreTaskFieldsFragment } from "@firefliesai/tasks-ff.graphql-client";
import type { SortableTask } from "@/screens/PersonalAssistant/helpers/useSortTasks";
import { createContext } from "react";

export const TasksContext = createContext(
  {} as {
    onlyMine: boolean;
    filterMyTasks: (task: CoreTaskFieldsFragment) => boolean;
    sortTasks: (a: SortableTask, b: SortableTask) => number;
  },
);

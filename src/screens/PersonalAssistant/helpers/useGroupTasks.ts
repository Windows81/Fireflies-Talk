import { EnumTaskStatus } from "@/graphql";
import { useMemo } from "react";
import { useSortTasks, type SortableTask } from "./useSortTasks";

export interface GroupableTask extends SortableTask {
  id: string;
  status?: string | null;
  generatedOwnerName?: string | null;
}

export interface OwnerGroup<T extends GroupableTask> {
  name: string;
  tasks: T[];
}

/** 0 = current user, 1 = user's group, 2 = everyone else, 3 = all tasks completed */
function getGroupPriority<T extends GroupableTask>(
  tasks: T[],
  currentUserParseId: string | undefined,
  userGroupIds: string[],
): number {
  // Groups where every task is completed always sort to the bottom,
  // regardless of owner identity.
  const allCompleted = tasks.every(
    (t) => t.status === EnumTaskStatus.Completed,
  );
  if (allCompleted) return 3;

  for (const task of tasks) {
    if (task.ownerId === currentUserParseId) return 0;
  }
  for (const task of tasks) {
    if (task.ownerId && userGroupIds.includes(task.ownerId)) return 1;
  }
  return 2;
}

/**
 * Group tasks by `generatedOwnerName`, sort tasks within each group via
 * `useSortTasks`, then order groups by priority:
 *   current user → user's team groups → everyone else → fully-completed groups
 * (alphabetical by group name as tie-breaker).
 *
 * Also exposes `currentUserParseId` and `userGroupIds` so callers can gate
 * per-task actions on ownership without re-calling `useSortTasks`.
 */
export const useGroupTasks = <T extends GroupableTask>(tasks: T[]) => {
  const { sortTasks, currentUserParseId, userGroupIds } = useSortTasks();

  const groups = useMemo<OwnerGroup<T>[]>(() => {
    const map = new Map<string, T[]>();
    for (const task of tasks) {
      const name = task.generatedOwnerName || "Unassigned";
      const group = map.get(name);
      if (group) {
        group.push(task);
      } else {
        map.set(name, [task]);
      }
    }

    const result: OwnerGroup<T>[] = Array.from(map, ([name, groupTasks]) => ({
      name,
      tasks: [...groupTasks].sort(sortTasks),
    }));

    result.sort((a, b) => {
      const aPriority = getGroupPriority(
        a.tasks,
        currentUserParseId,
        userGroupIds,
      );
      const bPriority = getGroupPriority(
        b.tasks,
        currentUserParseId,
        userGroupIds,
      );
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [tasks, sortTasks, currentUserParseId, userGroupIds]);

  return { groups, currentUserParseId, userGroupIds };
};

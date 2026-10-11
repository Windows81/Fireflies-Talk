import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import { useCallback, useMemo } from "react";

/**
 * Minimal shape required by the sort comparator.
 * Both CoreTaskFieldsFragment and MeetingPrepTask satisfy this structurally.
 */
export interface SortableTask {
  ownerId?: string | null;
  ownerEmail?: string | null;
  ownerType?: string | null;
  ownerProfile?: {
    __typename?: string;
    groupName?: string;
    name?: string | null;
  } | null;
  completedAt?: string | null;
}

/**
 * Shared task sort hook — mirrors the webapp's useSortTasks.
 *
 * Sort order:
 * 1. Pending tasks before completed
 * 2. Current user's tasks first
 * 3. User's group tasks second
 * 4. Remaining owners alphabetically
 * 5. Completed tasks by most recent first
 */
export const useSortTasks = () => {
  const { user } = useAuth();
  const { userGroups } = useTeam();

  const currentUserParseId = user?.id;
  const userGroupIds = useMemo(
    () => userGroups?.map((group) => group._id) ?? [],
    [userGroups],
  );

  const sortTasks = useCallback(
    (a: SortableTask, b: SortableTask) => {
      const aCompleted = a.completedAt ? 1 : 0;
      const bCompleted = b.completedAt ? 1 : 0;

      if (aCompleted !== bCompleted) return aCompleted - bCompleted;

      // Among pending tasks, apply owner-priority sorting
      if (!a.completedAt && !b.completedAt) {
        // Current user's tasks first
        const aUserPriority = a.ownerId === currentUserParseId ? 0 : 1;
        const bUserPriority = b.ownerId === currentUserParseId ? 0 : 1;
        if (aUserPriority !== bUserPriority)
          return aUserPriority - bUserPriority;

        // User's group tasks second
        const aGroupPriority =
          a.ownerId && userGroupIds.includes(a.ownerId) ? 0 : 1;
        const bGroupPriority =
          b.ownerId && userGroupIds.includes(b.ownerId) ? 0 : 1;
        if (aGroupPriority !== bGroupPriority)
          return aGroupPriority - bGroupPriority;

        // Alphabetical by owner name (unowned sort last)
        const aOwner = a.ownerId ?? "";
        const bOwner = b.ownerId ?? "";
        if (aOwner !== bOwner) {
          const aName =
            a.ownerProfile?.groupName ??
            a.ownerProfile?.name ??
            a.ownerEmail ??
            "zzz";
          const bName =
            b.ownerProfile?.groupName ??
            b.ownerProfile?.name ??
            b.ownerEmail ??
            "zzz";
          return aName.localeCompare(bName);
        }
      }

      // Among completed tasks, most recently completed first
      if (a.completedAt && b.completedAt) {
        return (
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );
      }

      return 0;
    },
    [currentUserParseId, userGroupIds],
  );

  return { sortTasks, currentUserParseId, userGroupIds };
};

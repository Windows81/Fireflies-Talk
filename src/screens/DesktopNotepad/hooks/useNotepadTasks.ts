import { Config } from "@/constants";
import { useAuth } from "@/features/auth/store";
import {
  useGetFeedMeetingByIdQuery,
  type CoreFeedMeetingFieldsFragment,
} from "@/graphql";
import { useSortTasks } from "@/screens/PersonalAssistant/helpers/useSortTasks";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useMutation } from "@apollo/client";
import {
  CreateTaskDocument,
  EnumCreateTaskOwnerType,
  EnumTaskOwnerType,
  EnumTaskStatus,
  UpdateTaskDocument,
  UpdateTaskOwnerDocument,
  UpdateTaskStatusDocument,
  type UpdateTaskMutation,
  type UpdateTaskOwnerMutation,
  type UpdateTaskStatusMutation,
} from "@firefliesai/tasks-ff.graphql-client";
import { useCallback, useMemo, useState } from "react";
import { isMeetingOwner } from "../helpers/meeting";
import {
  canModifyTask,
  getMeetingParticipants,
  isTaskAssignedToUser,
  isTaskCompleted,
  type NotepadParticipant,
  type NotepadTaskItem,
} from "../helpers/tasks";

export type NotepadTaskFilter = "all" | "my";

export interface NotepadTasksValue {
  meeting: CoreFeedMeetingFieldsFragment | null;
  pending: NotepadTaskItem[];
  completed: NotepadTaskItem[];
  totalCount: number;
  counts: Record<NotepadTaskFilter, number>;
  filter: NotepadTaskFilter;
  setFilter: (filter: NotepadTaskFilter) => void;
  loading: boolean;
  participants: NotepadParticipant[];
  // Per-task gate: false when the task is assigned to another individual.
  canEditTask: (task: NotepadTaskItem) => boolean;
  toggleTask: (task: NotepadTaskItem, completed: boolean) => void;
  createTask: (title: string) => void;
  assignTask: (task: NotepadTaskItem, owner: NotepadParticipant | null) => void;
  editTask: (task: NotepadTaskItem, title: string) => void;
}

export const useNotepadTasks = (meetingId: string): NotepadTasksValue => {
  const { sortTasks } = useSortTasks();
  const { user } = useAuth();
  const [filter, setFilter] = useState<NotepadTaskFilter>("all");

  const { data, loading } = useGetFeedMeetingByIdQuery({
    variables: { meetingId },
    fetchPolicy: "cache-and-network",
  });

  const meeting = data?.getFeedMeetingById ?? null;

  const counts = useMemo<Record<NotepadTaskFilter, number>>(() => {
    const tasks = meeting?.tasks ?? [];
    return {
      all: tasks.length,
      my: tasks.filter((task) => isTaskAssignedToUser(task, user)).length,
    };
  }, [meeting?.tasks, user]);

  const { pending, completed } = useMemo(() => {
    const tasks = (meeting?.tasks ?? []).filter(
      (task) => filter === "all" || isTaskAssignedToUser(task, user),
    );
    const pendingTasks: NotepadTaskItem[] = [];
    const completedTasks: NotepadTaskItem[] = [];
    for (const task of tasks) {
      (isTaskCompleted(task) ? completedTasks : pendingTasks).push(task);
    }
    return {
      pending: [...pendingTasks].sort(sortTasks),
      completed: [...completedTasks].sort(sortTasks),
    };
  }, [meeting?.tasks, sortTasks, filter, user]);

  const participants = useMemo(
    () => getMeetingParticipants(meeting),
    [meeting],
  );

  const meetingIsOwned = useMemo(
    () => (meeting ? isMeetingOwner(meeting, user) : false),
    [meeting, user],
  );

  const canEditTask = useCallback(
    (task: NotepadTaskItem) => canModifyTask(task, user, meetingIsOwned),
    [user, meetingIsOwned],
  );

  const [updateTaskStatus] = useMutation(UpdateTaskStatusDocument);
  const [createTaskMutation] = useMutation(CreateTaskDocument);
  const [updateTaskOwner] = useMutation(UpdateTaskOwnerDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);

  const toggleTask = useCallback(
    (task: NotepadTaskItem, completed: boolean) => {
      const status = completed
        ? EnumTaskStatus.Completed
        : EnumTaskStatus.Pending;
      updateTaskStatus({
        variables: { taskId: task.id, status, source: Config.NAME },
        optimisticResponse: {
          __typename: "Mutation",
          updateTaskStatus: {
            ...task,
            status,
            completedAt: completed ? new Date().toISOString() : null,
          },
        } as unknown as UpdateTaskStatusMutation,
      });
    },
    [updateTaskStatus],
  );

  const createTask = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed || !meeting) return;
      tracker.track(TRACKING_EVENTS.NOTEPAD_TASK_CREATED, { meetingId });
      createTaskMutation({
        variables: {
          meetingId: meeting._id,
          input: { title: trimmed, source: Config.NAME },
        },
        update(cache, { data: result }) {
          if (!result?.createTask) return;
          cache.modify({
            id: cache.identify(meeting),
            fields: {
              tasks(existing = [], { toReference }) {
                return [...existing, toReference(result.createTask)];
              },
            },
          });
        },
      });
    },
    [createTaskMutation, meeting, meetingId],
  );

  const assignTask = useCallback(
    (task: NotepadTaskItem, owner: NotepadParticipant | null) => {
      tracker.track(TRACKING_EVENTS.NOTEPAD_TASK_ASSIGNED, {
        meetingId,
        taskId: task.id,
        assigned: !!owner,
      });
      const input = owner
        ? {
            ownerId: owner.email,
            ownerType: EnumCreateTaskOwnerType.Email,
            source: Config.NAME,
          }
        : { ownerId: null, ownerType: null, source: Config.NAME };
      updateTaskOwner({
        variables: { taskId: task.id, input },
        optimisticResponse: {
          __typename: "Mutation",
          updateTaskOwner: {
            ...task,
            ownerId: owner?.email ?? null,
            ownerType: owner ? EnumTaskOwnerType.Email : null,
            ownerEmail: owner?.email ?? null,
            hasChangedOwner: true,
            generatedOwnerName: owner?.name ?? "Unassigned",
            ownerProfile: owner
              ? {
                  __typename: "Profile",
                  name: owner.name,
                  email: owner.email,
                  picture: owner.picture,
                }
              : null,
          },
        } as unknown as UpdateTaskOwnerMutation,
      });
    },
    [updateTaskOwner, meetingId],
  );

  const editTask = useCallback(
    (task: NotepadTaskItem, title: string) => {
      const trimmed = title.trim();
      if (!trimmed || trimmed === task.title) return;
      updateTask({
        variables: {
          taskId: task.id,
          input: { title: trimmed, source: Config.NAME },
        },
        optimisticResponse: {
          __typename: "Mutation",
          updateTask: { ...task, title: trimmed },
        } as unknown as UpdateTaskMutation,
      });
    },
    [updateTask],
  );

  return {
    meeting,
    pending,
    completed,
    totalCount: counts.all,
    counts,
    filter,
    setFilter,
    loading,
    participants,
    canEditTask,
    toggleTask,
    createTask,
    assignTask,
    editTask,
  };
};

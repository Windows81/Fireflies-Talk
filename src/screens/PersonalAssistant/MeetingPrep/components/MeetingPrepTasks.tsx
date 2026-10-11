import { IconTrash } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { Checkbox } from "@/components/Checkbox";
import { Swipeable } from "@/components/Swipeable";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import { type MeetingPrepTask } from "@/graphql";
import { useGroupTasks } from "@/screens/PersonalAssistant/helpers/useGroupTasks";
import { createStyles } from "@/styles";
import { getUniqueColor } from "@/utils/color";
import { GLOBAL } from "@/styles/color";
import { useMutation } from "@apollo/client";
import {
  DeleteTaskDocument,
  EnumTaskStatus,
  UpdateTaskStatusDocument,
  type UpdateTaskStatusMutation,
} from "@firefliesai/tasks-ff.graphql-client";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

const REFETCH_AFTER_MUTATION = ["GetMeetingPrepOutputWithTasks"];
const UNDO_TOAST_DURATION = 5000;

// Toggle/delete any task while testing locally.
// Production will always respect the task ownership.
const ALLOW_ALL_TASK_MUTATIONS_IN_DEV = __DEV__;

export type { MeetingPrepTask };

interface TaskOverride {
  status: string;
  completedAt: string | null;
}

const TaskRow: FC<{
  task: MeetingPrepTask;
  isAssignedToMe: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onDeleteChange: (id: string, isDeleted: boolean) => void;
}> = ({ task, isAssignedToMe, onStatusChange, onDeleteChange }) => {
  const completed = task.status === EnumTaskStatus.Completed;
  const ownerLabel = task.generatedOwnerName || "its owner";

  const [updateTaskStatus] = useMutation(UpdateTaskStatusDocument, {
    refetchQueries: REFETCH_AFTER_MUTATION,
    optimisticResponse(vars) {
      return {
        __typename: "Mutation",
        updateTaskStatus: {
          __typename: "Task",
          ...task,
          status: vars.status,
          completedAt:
            vars.status === EnumTaskStatus.Completed
              ? new Date().toISOString()
              : null,
          ownerProfile: null,
        },
      } as unknown as UpdateTaskStatusMutation;
    },
  });

  const [deleteTask] = useMutation(DeleteTaskDocument, {
    variables: {
      taskId: task.id,
      source: Config.NAME,
    },
    refetchQueries: REFETCH_AFTER_MUTATION,
    onError(err) {
      onDeleteChange(task.id, false);
      toast({
        title: "Failed to delete task",
        message: err.message,
        type: "error",
      });
    },
  });

  const applyStatus = useCallback(
    (nextStatus: EnumTaskStatus) => {
      const prevStatus = task.status;
      onStatusChange(task.id, nextStatus);
      updateTaskStatus({
        variables: {
          taskId: task.id,
          status: nextStatus,
          source: Config.NAME,
        },
        onError(err) {
          onStatusChange(task.id, prevStatus);
          toast({
            title: "Failed to update task",
            message: err.message,
            type: "error",
          });
        },
      });
    },
    [task.id, task.status, updateTaskStatus, onStatusChange],
  );

  const handleToggle = useCallback(
    (checked: boolean) => {
      if (!isAssignedToMe) {
        toast({
          message: `This task can be updated only by ${ownerLabel}.`,
          type: "warning",
        });
        return;
      }
      const nextStatus = checked
        ? EnumTaskStatus.Completed
        : EnumTaskStatus.Pending;
      const prevStatus = checked
        ? EnumTaskStatus.Pending
        : EnumTaskStatus.Completed;
      applyStatus(nextStatus);
      toast({
        message: checked
          ? "Task marked as completed"
          : "Task marked as pending",
        type: "success",
        duration: UNDO_TOAST_DURATION,
        action: {
          label: "Undo",
          color: GLOBAL.purple200,
          onPress: () => applyStatus(prevStatus),
        },
      });
    },
    [applyStatus, isAssignedToMe, ownerLabel],
  );

  const handleDelete = useCallback(() => {
    if (!isAssignedToMe) {
      toast({
        message: `This task can be deleted only by ${ownerLabel}.`,
        type: "warning",
      });
      return;
    }
    onDeleteChange(task.id, true);
    deleteTask();
    toast({
      message: "Task deleted",
      type: "success",
    });
  }, [task.id, deleteTask, onDeleteChange, isAssignedToMe, ownerLabel]);

  return (
    <Swipeable
      view={
        <View style={styles.taskRow}>
          <Checkbox
            value={completed}
            onValueChange={handleToggle}
            borderColor={isAssignedToMe ? "textSecondary" : undefined}
            aria-label={`Mark "${task.title}" as ${completed ? "pending" : "completed"}`}
          />
          <Text
            variant="body2Regular"
            color={completed ? "textHint" : "textSecondary"}
            numberOfLines={3}
            style={[styles.taskTitle, completed && styles.taskTitleCompleted]}
          >
            {task.title}
          </Text>
        </View>
      }
      swipeRight={{
        label: "Delete Task",
        Icon: IconTrash,
        onPress: handleDelete,
      }}
    />
  );
};

export const MeetingPrepTasks: FC<{ tasks: MeetingPrepTask[] }> = ({
  tasks: initialTasks,
}) => {
  // Local state so completed tasks re-sort to the bottom immediately.
  // Tracks both status and completedAt because the sort uses completedAt.
  const [taskOverrides, setTaskOverrides] = useState<
    Record<string, TaskOverride>
  >({});

  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );

  const tasksWithLocalStatus = useMemo(
    () =>
      initialTasks
        .filter((t) => !deletedTaskIds.has(t.id))
        .map((t) => {
          const override = taskOverrides[t.id];
          if (!override) return t;
          return {
            ...t,
            status: override.status,
            completedAt: override.completedAt,
          };
        }),
    [initialTasks, taskOverrides, deletedTaskIds],
  );

  const { groups, currentUserParseId, userGroupIds } =
    useGroupTasks(tasksWithLocalStatus);

  const handleStatusChange = useCallback((id: string, newStatus: string) => {
    setTaskOverrides((prev) => ({
      ...prev,
      [id]: {
        status: newStatus,
        completedAt:
          newStatus === EnumTaskStatus.Completed
            ? new Date().toISOString()
            : null,
      },
    }));
  }, []);

  const handleDeleteChange = useCallback((id: string, isDeleted: boolean) => {
    setDeletedTaskIds((prev) => {
      const next = new Set(prev);
      if (isDeleted) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return (
    <View style={styles.root}>
      {groups.map((group) => {
        const avatarColor = getUniqueColor(group.name);
        return (
          <Animated.View
            key={group.name}
            layout={LinearTransition.duration(350)}
            style={styles.ownerGroup}
          >
            <View style={styles.ownerHeader}>
              <Avatar name={group.name} size={20} shape="square" />
              <View
                style={[
                  styles.ownerBadge,
                  { backgroundColor: avatarColor + "20" },
                ]}
              >
                <Text variant="body2Regular" color="textSecondary">
                  {group.name}
                </Text>
              </View>
            </View>
            {group.tasks.map((task) => {
              const isAssignedToMe =
                ALLOW_ALL_TASK_MUTATIONS_IN_DEV ||
                (!!task.ownerId &&
                  (task.ownerId === currentUserParseId ||
                    userGroupIds.includes(task.ownerId)));
              return (
                <Animated.View
                  key={task.id}
                  layout={LinearTransition.duration(350)}
                >
                  <TaskRow
                    task={task}
                    isAssignedToMe={isAssignedToMe}
                    onStatusChange={handleStatusChange}
                    onDeleteChange={handleDeleteChange}
                  />
                </Animated.View>
              );
            })}
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = createStyles({
  root: {
    gap: 20,
    marginHorizontal: -20,
  },
  ownerGroup: {
    gap: 4,
  },
  ownerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  taskTitle: {
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
  },
});

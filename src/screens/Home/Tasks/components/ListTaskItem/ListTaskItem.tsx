import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { Checkbox } from "@/components/Checkbox";
import { SkeletonLoading } from "@/components/Loading";
import { toast } from "@/components/Toast";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useMutation } from "@apollo/client";
import type {
  UpdateTaskMutation,
  UpdateTaskOwnerMutation,
  UpdateTaskStatusMutation,
} from "@firefliesai/tasks-ff.graphql-client";
import {
  DeleteTaskDocument,
  EnumCreateTaskOwnerType,
  EnumTaskOwnerType,
  EnumTaskStatus,
  UpdateTaskDocument,
  UpdateTaskOwnerDocument,
  UpdateTaskStatusDocument,
  type CoreFeedMeetingFieldsFragment,
  type CoreTaskFieldsFragment,
} from "@firefliesai/tasks-ff.graphql-client";
import type { FC } from "react";
import { useCallback, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { TaskItemAssignedTo } from "../TaskItemEditor/TaskItemAssignedTo";
import type {
  EditableTaskData,
  HandleChangeOwnerFn,
} from "../TaskItemEditor/types";
import { ListTaskItemEditor, toEditableTaskData } from "./ListTaskItemEditor";
import { ListTaskItemTitle } from "./ListTaskItemTitle";
import { Config } from "@/constants";
import { appReviewApi } from "@/features/app-review";

const transition = LinearTransition.duration(250);

export const ListTaskItem: FC<{
  meeting: CoreFeedMeetingFieldsFragment;
  task: CoreTaskFieldsFragment;
}> = ({ meeting, task }) => {
  const theme = useTheme();

  const [updateTask, { loading: isLoadingUpdateTask }] = useMutation(
    UpdateTaskDocument,
    {
      onError(err) {
        toast({
          title: "Failed to update task",
          message: err.message,
          type: "error",
        });
      },
      optimisticResponse(vars) {
        return {
          __typename: "Mutation",
          updateTask: {
            __typename: "Task",
            ...task,
            ...vars.input,
          },
        } as UpdateTaskMutation;
      },
      errorPolicy: "none",
    },
  );

  const [updateTaskStatus] = useMutation(UpdateTaskStatusDocument, {
    onError(err) {
      toast({
        title: "Failed to update task status",
        message: err.message,
        type: "error",
      });
    },
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
        },
      } as UpdateTaskStatusMutation;
    },
  });

  const [updateTaskOwner, { loading: loadingUpdateTaskOwner }] = useMutation(
    UpdateTaskOwnerDocument,
    {
      onError(err) {
        toast({
          title: "Failed to update task owner",
          message: err.message,
          type: "error",
        });
      },
      errorPolicy: "none",
    },
  );

  const [deleteTask, { loading: isDeleting }] = useMutation(
    DeleteTaskDocument,
    {
      variables: {
        taskId: task.id,
        source: Config.NAME,
      },
      onCompleted() {
        toast({
          message: "Task deleted",
          type: "success",
        });
      },
      onError(err) {
        toast({
          title: "Failed to delete task",
          message: err.message,
          type: "error",
        });
      },
      update(cache, result) {
        if (!result.data?.deleteTask) return;
        cache.modify<CoreFeedMeetingFieldsFragment>({
          id: cache.identify(meeting),
          fields: {
            tasks(existingTaskRefs = [], { readField }) {
              return existingTaskRefs.filter(
                (taskRef) => task.id !== readField("id", taskRef),
              );
            },
          },
        });
      },
      errorPolicy: "none",
    },
  );

  const handleChangeStatus = useCallback(
    (checked: boolean) => {
      updateTaskStatus({
        variables: {
          taskId: task.id,
          status: checked ? EnumTaskStatus.Completed : EnumTaskStatus.Pending,
          source: Config.NAME,
        },
      });

      if (checked) {
        appReviewApi.increaseCompletedTaskCount();
      }
    },
    [task, updateTaskStatus],
  );

  const handleChangeOwner = useCallback<HandleChangeOwnerFn>(
    (input, ownerProfile) => {
      const getTaskOwnerType = () => {
        if (input.ownerType === EnumCreateTaskOwnerType.UserGroup) {
          return {
            ownerEmail: null,
            ownerId: input.ownerId,
            ownerType: EnumTaskOwnerType.UserGroup,
            ownerProfile: ownerProfile || null,
          };
        }

        if (input.ownerType === EnumCreateTaskOwnerType.Email) {
          return {
            ownerEmail: input.ownerId,
            // ownerId would be the user id of the user when resolving
            // on the server side. but for the purpose of an optimistic UI,
            // this does not matter.
            ownerId: null,
            ownerType: EnumTaskOwnerType.Email,
            ownerProfile: ownerProfile || null,
          };
        }

        return {
          ownerEmail: null,
          ownerId: null,
          ownerType: null,
          ownerProfile: null,
        };
      };

      updateTaskOwner({
        variables: {
          taskId: task.id,
          input: {
            ...input,
            source: Config.NAME,
          },
        },
        optimisticResponse: {
          __typename: "Mutation",
          updateTaskOwner: {
            ...task,
            ...getTaskOwnerType(),
          },
        } as UpdateTaskOwnerMutation,
      });
    },
    [task, updateTaskOwner],
  );

  const handleChangeTitle = useCallback(
    (title: string) => {
      const savingTitle = title.trim();
      if (!savingTitle) {
        return;
      }
      updateTask({
        variables: {
          taskId: task.id,
          input: {
            title: savingTitle,
            source: Config.NAME,
          },
        },
      });
    },
    [updateTask, task],
  );

  const handleDelete = useCallback(() => {
    deleteTask();
  }, [deleteTask]);

  const editingTask = useMemo<EditableTaskData>(() => {
    return toEditableTaskData(task);
  }, [task]);

  const completed = task.status === EnumTaskStatus.Completed;

  const loading = isLoadingUpdateTask || loadingUpdateTaskOwner || isDeleting;

  const [isOpenEdit, openEdit, closeEdit] = useBooleanState();
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState();

  return (
    <>
      <Animated.View
        style={[styles.root(theme), isDeleting && styles.rootDeleting(theme)]}
        layout={transition}
        exiting={FadeOut.duration(250)}
        entering={FadeIn.duration(250)}
      >
        <View style={styles.leading}>
          <Checkbox
            value={completed}
            onValueChange={handleChangeStatus}
            aria-label="Task status"
          />
          <TouchableOpacity
            style={styles.pressable}
            onPress={openEdit}
            onLongPress={openMenu}
            disabled={loading}
          >
            <ListTaskItemTitle title={task.title} completed={completed} />
          </TouchableOpacity>
        </View>
        <TaskItemAssignedTo
          task={editingTask}
          meeting={meeting}
          handleChangeOwner={handleChangeOwner}
          loading={loading}
        />
      </Animated.View>
      <ListTaskItemEditor
        isOpen={isOpenEdit}
        close={closeEdit}
        meeting={meeting}
        task={task}
        loading={loading}
        handleChangeOwner={handleChangeOwner}
        handleChangeTitle={handleChangeTitle}
        handleDelete={handleDelete}
      />
      <BottomSheetMenuModal
        isOpen={isOpenMenu}
        close={closeMenu}
        items={[
          {
            label: "Edit task",
            onPress: openEdit,
          },
          {
            label: "Delete task",
            onPress: handleDelete,
          },
        ]}
      />
    </>
  );
};

export const LoadingListTaskItem: FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.root(theme)}>
      <View style={styles.leading}>
        <Checkbox value={false} aria-label="Task status" disabled />
        <SkeletonLoading width={264} height={12} />
      </View>
      <SkeletonLoading width={64} height={12} />
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
    ...(theme.breakpoint === Breakpoint.Small
      ? {
          backgroundColor: theme.colors.layerSubtle,
        }
      : {
          borderBottomColor: theme.colors.borderStaticDefault,
          borderBottomWidth: 1,
        }),
  }),
  rootDeleting: (theme) => ({
    backgroundColor: theme.colors.interactiveDangerSecondaryDefault,
  }),
  pressable: {
    flex: 1,
    justifyContent: "center",
  },
  leading: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
    flex: 1,
  },
});

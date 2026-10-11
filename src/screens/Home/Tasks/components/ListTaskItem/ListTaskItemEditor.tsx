import { Dialog } from "@/components/Dialog";
import {
  EnumCreateTaskOwnerType,
  EnumTaskOwnerType,
  type CoreFeedMeetingFieldsFragment,
  type CoreTaskFieldsFragment,
} from "@firefliesai/tasks-ff.graphql-client";
import { useCallback, useMemo, type FC } from "react";
import { TaskItemEditor } from "../TaskItemEditor/TaskItemEditor";
import type {
  EditableTaskData,
  HandleChangeOwnerFn,
} from "../TaskItemEditor/types";

export const ListTaskItemEditor: FC<{
  meeting: CoreFeedMeetingFieldsFragment;
  task: CoreTaskFieldsFragment;
  loading?: boolean;
  handleChangeOwner: HandleChangeOwnerFn;
  handleChangeTitle: (title: string) => void;
  isOpen: boolean;
  close: () => void;
  handleDelete?: () => void;
}> = ({
  isOpen,
  close,
  loading,
  meeting,
  task,
  handleChangeOwner,
  handleChangeTitle,
  handleDelete,
}) => {
  const editingTask = useMemo<EditableTaskData>(() => {
    return toEditableTaskData(task);
  }, [task]);

  const handleSubmit = useCallback(
    (task: Partial<EditableTaskData>) => {
      if (task.title) handleChangeTitle(task.title);
      if (task.ownerId !== undefined)
        handleChangeOwner(
          {
            ownerId: task.ownerId,
            ownerType: task.ownerType || null,
          },
          task.ownerProfile,
        );
    },
    [handleChangeOwner, handleChangeTitle],
  );

  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
      <TaskItemEditor
        meeting={meeting}
        initialTask={editingTask}
        loading={loading}
        handleSubmit={handleSubmit}
        handleDelete={handleDelete}
        isCreating={false}
        close={close}
      />
    </Dialog.Root>
  );
};

export const toEditableTaskData = (task: CoreTaskFieldsFragment) => {
  let ownerType: EditableTaskData["ownerType"] = null;
  if (task.ownerType === EnumTaskOwnerType.UserGroup) {
    ownerType = EnumCreateTaskOwnerType.UserGroup;
  } else if (task.ownerType) {
    ownerType = EnumCreateTaskOwnerType.Email;
  }
  return {
    title: task.title,
    ownerId: task.ownerId || null,
    ownerType: ownerType,
    ownerEmail: task.ownerEmail,
    ownerProfile: task.ownerProfile as EditableTaskData["ownerProfile"],
    generatedOwnerName: task.generatedOwnerName,
    hasChangedOwner: task.hasChangedOwner,
  };
};

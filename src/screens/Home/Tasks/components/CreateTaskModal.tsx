import { Dialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import { Config } from "@/constants";
import { useMutation } from "@apollo/client";
import type { CreateTaskInput } from "@firefliesai/tasks-ff.graphql-client";
import {
  CreateTaskDocument,
  type CoreFeedMeetingFieldsFragment,
} from "@firefliesai/tasks-ff.graphql-client";
import { useCallback, type FC } from "react";
import { TaskItemEditor } from "./TaskItemEditor/TaskItemEditor";
import type { EditableTaskData } from "./TaskItemEditor/types";

const CreateTaskModalContent: FC<{
  meeting: CoreFeedMeetingFieldsFragment;
  close: () => void;
}> = ({ meeting, close }) => {
  const [createTask, { loading }] = useMutation(CreateTaskDocument, {
    onCompleted() {
      close();
    },
    onError(err) {
      toast({
        title: "Failed to create task",
        message: err.message,
        type: "error",
      });
    },
    update(cache, { data }) {
      if (data?.createTask) {
        cache.modify({
          id: cache.identify(meeting),
          fields: {
            tasks(existingTaskRefs = [], { toReference }) {
              return [...existingTaskRefs, toReference(data.createTask)];
            },
          },
        });
      }
    },
    errorPolicy: "none",
  });

  const submitCreate = useCallback(
    (data: Partial<EditableTaskData>) => {
      if (loading) return;
      if (!data.title) return;
      const input: CreateTaskInput = {
        title: data.title,
        ownerId: data.ownerId,
        ownerType: data.ownerType,
        source: Config.NAME,
      };
      createTask({
        variables: {
          input,
          meetingId: meeting._id,
        },
      });
    },
    [loading, createTask, meeting._id],
  );

  return (
    <TaskItemEditor
      meeting={meeting}
      loading={loading}
      handleSubmit={submitCreate}
      isCreating
      close={close}
    />
  );
};

export const CreateTaskModal: FC<{
  meeting: CoreFeedMeetingFieldsFragment;
  isOpen: boolean;
  close: () => void;
}> = ({ meeting, isOpen, close }) => {
  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
      <CreateTaskModalContent meeting={meeting} close={close} />
    </Dialog.Root>
  );
};

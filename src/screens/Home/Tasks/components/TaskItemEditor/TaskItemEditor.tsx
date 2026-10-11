import { IconArrowLeft, IconTrash, IconX } from "@/assets/svg";
import { Button } from "@/components/Button";
import { HeaderIconButton, KeyboardPersistTapsView } from "@/components/Layout";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, vars } from "@/styles";
import type { CoreFeedMeetingFieldsFragment } from "@firefliesai/tasks-ff.graphql-client";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { Platform, TextInput, View } from "react-native";
import { TaskItemAssignedTo } from "./TaskItemAssignedTo";
import type { EditableTaskData, HandleChangeOwnerFn } from "./types";

export const TaskItemEditor: FC<{
  meeting: CoreFeedMeetingFieldsFragment;
  initialTask?: EditableTaskData;
  handleDelete?: () => void;
  handleSubmit: (task: Partial<EditableTaskData>) => void;
  loading?: boolean;
  isCreating?: boolean;
  close: () => void;
}> = ({
  initialTask,
  meeting,
  loading,
  isCreating,
  handleDelete,
  handleSubmit,
  close,
}) => {
  const [task, setTask] = useState<EditableTaskData>(
    initialTask || {
      title: "",
      ownerId: null,
      ownerType: null,
    },
  );

  const [height, setHeight] = useState(120);

  const trimmedTitle = task.title.trim();

  const handleChangeTitle = useCallback((title: string) => {
    setTask((prev) => ({
      ...prev,
      title,
    }));
  }, []);

  const handleChangeOwner = useCallback<HandleChangeOwnerFn>(
    (newOwner, ownerProfile) => {
      setTask((prev) => ({
        ...prev,
        ...newOwner,
        ownerProfile,
      }));
    },
    [],
  );

  const onDelete = () => {
    close();
    handleDelete?.();
  };

  const hasTitleChanged = trimmedTitle !== initialTask?.title;
  const hasOwnerChanged =
    task.ownerId !== initialTask?.ownerId ||
    task.ownerType !== initialTask?.ownerType;
  const canSave = !!trimmedTitle;

  const onSave = () => {
    if (!hasTitleChanged && !hasOwnerChanged) {
      close();
      return;
    }
    const { ownerId, ownerType, ownerProfile } = task;
    handleSubmit({
      ...(hasTitleChanged && {
        title: trimmedTitle,
      }),
      ...(hasOwnerChanged && {
        ownerId,
        ownerType,
        ownerProfile,
      }),
    });
    close();
  };

  const theme = useTheme();

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // FIXME: modal + autoFocus breaks
    // keyboard focus on Android. Need to find
    // a better solution. More correct is to
    // call focus() on Modal.onShow
    // but this should work for now.
    if (Platform.OS !== "android") return;
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 1000);
    }
  }, []);

  return (
    <KeyboardPersistTapsView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        {isCreating ? (
          <>
            <Text variant="title2Weight">Create Task</Text>
            <HeaderIconButton
              Icon={IconX}
              iconSize={24}
              label="Close"
              onPress={close}
              color="commandHintDefault"
            />
          </>
        ) : (
          <>
            <HeaderIconButton
              Icon={IconArrowLeft}
              iconSize={24}
              label="Back"
              onPress={close}
            />
            <HeaderIconButton
              Icon={IconTrash}
              iconSize={20}
              label="Delete task"
              onPress={onDelete}
            />
          </>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.horPad}>
          <TaskItemAssignedTo
            meeting={meeting}
            task={task}
            loading={loading}
            handleChangeOwner={handleChangeOwner}
            forceFullVariant
            showDropdownArrow
          />
        </View>
        <View
          style={{
            minHeight: height,
          }}
        >
          <TextInput
            ref={inputRef}
            value={task.title}
            onChangeText={handleChangeTitle}
            style={[styles.horPad, styles.textInput(theme)]}
            textAlignVertical="top"
            onContentSizeChange={(e) => {
              setHeight(e.nativeEvent.contentSize.height);
            }}
            placeholder="Enter task"
            multiline
            autoFocus={Platform.OS !== "android"}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Button disabled={!canSave || loading} onPress={onSave}>
          {isCreating ? "Create" : "Save"}
        </Button>
      </View>
    </KeyboardPersistTapsView>
  );
};

const styles = createStyles({
  root: {
    gap: 16,
  },
  content: {
    gap: 16,
  },
  horPad: {
    paddingHorizontal: 20,
  },
  textInput: (theme) => ({
    ...vars.typography.body1Regular,
    color: theme.colors.textSecondary,
  }),
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footer: {
    height: 52,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
});

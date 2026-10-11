import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { TagInputField, TextField } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { toast } from "@/components/Toast";
import {
  GetCategoriesDocument,
  useInsertCategoriesMutation,
  useUpdateCategoriesMutation,
  type Categories,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { useCallback, useMemo, useState, type FC } from "react";
import { ScrollView, Text, View } from "react-native";
import { getMessageForError } from "../utils/error";

const CreateTopicTrackerModalContent: FC<{
  close: () => void;
  categoryToEdit?: Categories;
  onCreated?: (category: Categories) => void;
  onUpdated?: (category?: Categories | null) => void;
  isAdmin: boolean;
}> = ({ close, categoryToEdit, onCreated, onUpdated, isAdmin }) => {
  const theme = useTheme();

  const [isTeamAccessEnabled, setTeamAccess] = useState(
    categoryToEdit?.teamAccess ?? false,
  );

  const [topicTitle, setTopicTitle] = useState(
    categoryToEdit?.property?.name ?? "",
  );
  const [subProperties, setSubProperties] = useState<string[]>(
    categoryToEdit?.property?.subProperties ?? [],
  );

  const trimmedTopicTitle = useMemo(() => topicTitle.trim(), [topicTitle]);

  const [createTopic] = useInsertCategoriesMutation({
    refetchQueries: [GetCategoriesDocument],
    onCompleted(data) {
      toast({
        message: "Topic created",
        type: "success",
      });
      onCreated?.(data.insertCategories);
    },
    onError(err) {
      toast({
        title: "Could not create topic",
        message: getMessageForError(err),
        type: "error",
      });
    },
  });

  const [updateTopic] = useUpdateCategoriesMutation({
    refetchQueries: [GetCategoriesDocument],
    onCompleted(data) {
      toast({
        message: "Topic updated",
        type: "success",
      });
      onUpdated?.(data.updateCategories);
    },
    onError(err) {
      toast({
        title: "Could not update topic",
        message: getMessageForError(err),
        type: "error",
      });
    },
  });

  const upsertTopic = useCallback(() => {
    if (categoryToEdit) {
      updateTopic({
        variables: {
          _id: categoryToEdit._id,
          name: trimmedTopicTitle,
          subProperties: subProperties,
          teamAccess: isTeamAccessEnabled,
        },
      });
    } else {
      createTopic({
        variables: {
          name: trimmedTopicTitle,
          subProperties: subProperties,
          teamAccess: isTeamAccessEnabled,
        },
      });
    }

    close();
  }, [
    updateTopic,
    createTopic,
    subProperties,
    categoryToEdit,
    isTeamAccessEnabled,
    close,
    trimmedTopicTitle,
  ]);

  return (
    <>
      <View style={styles.root}>
        <ScrollView
          style={styles.flexContainer}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <TextField
            label="Title"
            value={topicTitle}
            onValueChange={setTopicTitle}
            placeholder="Topic Title"
            style={styles.titleInput}
          />
          <TagInputField
            label="Keywords"
            value={subProperties}
            onChangeValue={setSubProperties}
            placeholder="Enter keywords"
          />
        </ScrollView>

        {isAdmin && (
          <View style={styles.teamAdminContainer}>
            <Text style={styles.switchText(theme)}>Enable for teammates</Text>
            <Switch
              value={isTeamAccessEnabled}
              onValueChange={() => setTeamAccess(!isTeamAccessEnabled)}
            />
          </View>
        )}
        <Button
          disabled={
            trimmedTopicTitle.length === 0 || subProperties.length === 0
          }
          onPress={upsertTopic}
        >
          {categoryToEdit ? "Update" : "Create"}
        </Button>
      </View>
    </>
  );
};

export const CreateTopicTrackerModal: FC<{
  isOpen: boolean;
  close: () => void;
  categoryToEdit?: Categories;
  onCreated?: (category: Categories) => void;
  onUpdated?: (category: Categories) => void;
  isAdmin: boolean;
}> = ({ isOpen, close, categoryToEdit, onCreated, isAdmin }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close} variant="fullscreen">
      <Dialog.Header>
        {categoryToEdit ? "Edit topic" : "New topic"}
      </Dialog.Header>
      <CreateTopicTrackerModalContent
        close={close}
        onCreated={onCreated}
        categoryToEdit={categoryToEdit}
        isAdmin={isAdmin}
      />
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  flexContainer: {
    flex: 1,
  },
  titleInput: {
    marginBottom: 8,
  },
  teamAdminContainer: {
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  switchText: (theme) => ({
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginRight: 8,
  }),
  scrollContentContainer: {
    gap: 8,
  },
});

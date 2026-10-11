import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import {
  type Categories,
  GetCategoriesDocument,
  useDeleteCategoriesMutation,
} from "@/graphql";
import type { FC } from "react";
import { Text } from "@/components/Typography";

export const TopicDeleteDialog: FC<{
  category: Categories;
  isOpen: boolean;
  close: () => void;
  onDelete?: () => void;
}> = ({ category, isOpen, close, onDelete }) => {
  const [deleteTopic, { loading }] = useDeleteCategoriesMutation({
    refetchQueries: [GetCategoriesDocument],
    variables: {
      _id: category._id,
    },
    onCompleted() {
      toast({
        type: "success",
        message: "Topic has been deleted",
      });
      close();
      onDelete?.();
    },
    onError(err) {
      toast({
        title: "Could not delete topic",
        message: err.message,
        type: "error",
      });
    },
  });

  const onConfirm = () => {
    deleteTopic();
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      close={close}
      title="Delete Topic?"
      confirmText="Delete Topic"
      onConfirm={onConfirm}
      loading={loading}
    >
      <Text variant="title2Weight" color="textSecondary">
        {category.property?.name}
      </Text>
      {` will be deleted along with ${category.property?.subProperties?.length ?? 0} keyword(s). Once deleted, you would not be able to easily filter out this topic in your meetings.`}
    </ConfirmationDialog>
  );
};

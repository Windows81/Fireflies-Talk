import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import {
  GetSoundbitesDocument,
  useDeleteSoundbiteMutation,
} from "@firefliesai/bites-ff.graphql-client";
import type { FC } from "react";

export const BiteDeleteDialog: FC<{
  bite: Soundbite;
  isOpen: boolean;
  close: () => void;
  onDelete?: () => void;
}> = ({ bite, isOpen, close, onDelete }) => {
  const [deleteSoundbite, { loading }] = useDeleteSoundbiteMutation({
    refetchQueries: [GetSoundbitesDocument],
    variables: {
      id: bite.id,
      ref: "mobile",
    },
    onCompleted() {
      toast({
        type: "success",
        message: "Soundbite has been deleted.",
      });
      close();
      onDelete?.();
    },
    onError(err) {
      toast({
        title: "Could not delete soundbite",
        message: err.message,
        type: "error",
      });
    },
  });

  const onConfirm = () => {
    deleteSoundbite();
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      close={close}
      title="Delete Soundbite"
      confirmText="Delete"
      onConfirm={onConfirm}
      loading={loading}
    >
      Are you sure you want to delete this meeting? This cannot be undone.
    </ConfirmationDialog>
  );
};

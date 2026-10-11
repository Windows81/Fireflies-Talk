import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import {
  GetPlaylistsDocument,
  useDeletePlaylistMutation,
} from "@firefliesai/bites-ff.graphql-client";
import type { FC } from "react";

export const PlaylistDeleteDialog: FC<{
  playlist: Playlist;
  isOpen: boolean;
  close: () => void;
  onDelete?: () => void;
}> = ({ playlist, isOpen, close, onDelete }) => {
  const [deletePlaylist, { loading }] = useDeletePlaylistMutation({
    refetchQueries: [GetPlaylistsDocument],
    variables: {
      id: playlist.id,
      ref: "mobile",
    },
    onCompleted() {
      toast({
        type: "success",
        message: "Playlist has been deleted.",
      });
      close();
      onDelete?.();
    },
    onError(err) {
      toast({
        title: "Could not delete playlist",
        message: err.message,
        type: "error",
      });
    },
  });

  const onConfirm = () => {
    deletePlaylist();
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      close={close}
      title="Delete Playlist"
      confirmText="Delete"
      onConfirm={onConfirm}
      loading={loading}
    >
      Are you sure you want to delete this playlist? This cannot be undone.
    </ConfirmationDialog>
  );
};

import { IconShare, IconTrash } from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isTruthy } from "@/utils/object";
import { useBooleanState } from "@/utils/states";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import type { FC } from "react";
import { useCanManagePlaylist } from "../utils/permissions";
import { PlaylistDeleteDialog } from "./PlaylistDeleteDialog";
import { PlaylistShareDialog } from "./PlaylistShareDialog";

export const PlaylistBottomSheetMenu: FC<{
  playlist: Playlist;
  isOpen: boolean;
  close: () => void;
  onDelete?: () => void;
}> = ({ playlist, isOpen, close, onDelete }) => {
  const [isOpenShare, openShare, closeShare] = useBooleanState();
  const [isOpenDelete, openDelete, closeDelete] = useBooleanState();

  const canDelete = useCanManagePlaylist(playlist);

  return (
    <>
      <BottomSheetMenuModal
        isOpen={isOpen}
        close={close}
        items={[
          {
            Icon: IconShare,
            label: "Share playlist",
            onPress() {
              openShare();
              tracker.track(TRACKING_EVENTS.SHARE_DIALOG_OPENED, {
                type: "playlist",
                from: "bottom-sheet-menu",
                playlistId: playlist.id,
                privacy: playlist.privacy,
              });
            },
          },
          canDelete && {
            Icon: IconTrash,
            label: "Delete playlist",
            onPress: openDelete,
          },
        ].filter(isTruthy)}
      />
      <PlaylistShareDialog
        playlist={playlist}
        isOpen={isOpenShare}
        close={closeShare}
      />
      <PlaylistDeleteDialog
        playlist={playlist}
        isOpen={isOpenDelete}
        close={closeDelete}
        onDelete={onDelete}
      />
    </>
  );
};

import { IconDownload, IconPlus, IconShare, IconTrash } from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { useAuth } from "@/features/auth";
import { usePaywallConfig } from "@/features/billing";
import { openDownloadPaywallModal } from "@/features/global-modals";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isTruthy } from "@/utils/object";
import { useBooleanState } from "@/utils/states";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import { isPaidUser } from "@firefliesai/payments-ff.utils";
import type { FC } from "react";
import { openAddToPlaylistModal } from "src/features/global-modals";
import { useCanManageBite } from "../utils/permissions";
import { BiteDeleteDialog } from "./BiteDeleteDialog";
import { BiteDownloadDialog } from "./BiteDownloadDialog";
import { BiteShareDialog } from "./BiteShareDialog";

export const BiteBottomSheetMenu: FC<{
  bite: Soundbite;
  isOpen: boolean;
  close: () => void;
  onDelete?: () => void;
  showDownload?: boolean;
  fromRef: string;
}> = ({ bite, isOpen, close, onDelete, showDownload, fromRef }) => {
  const [isOpenShare, openShare, closeShare] = useBooleanState();
  const [isOpenDelete, openDelete, closeDelete] = useBooleanState();
  const [isOpenDownload, openDownload, closeDownload] = useBooleanState();

  const canDelete = useCanManageBite(bite);

  const { hidePaidFeatures } = usePaywallConfig();
  const { user } = useAuth();

  return (
    <>
      <BottomSheetMenuModal
        isOpen={isOpen}
        close={close}
        items={[
          {
            Icon: IconPlus,
            label: "Add to playlist",
            onPress() {
              openAddToPlaylistModal({
                fromRef: `${fromRef ? `${fromRef}/` : ""}bottom-sheet-menu`,
                bite,
              });
            },
          },
          {
            Icon: IconShare,
            label: "Share soundbite",
            onPress() {
              openShare();
              tracker.track(TRACKING_EVENTS.SHARE_DIALOG_OPENED, {
                type: "soundbite",
                from: "bottom-sheet-menu",
                biteId: bite.id,
                privacy: bite.privacies.join(" "),
              });
            },
          },
          !hidePaidFeatures &&
            showDownload && {
              Icon: IconDownload,
              label: "Download soundbite",
              onPress() {
                if (!user?.paidUser || !isPaidUser(user?.paidUser)) {
                  openDownloadPaywallModal(fromRef);
                  return;
                }
                openDownload();
                tracker.track(TRACKING_EVENTS.DOWNLOAD_MODAL_OPENED, {
                  type: "soundbite",
                  from: "bottom-sheet-menu",
                  biteId: bite.id,
                });
              },
            },
          canDelete && {
            Icon: IconTrash,
            label: "Delete soundbite",
            onPress: openDelete,
          },
        ].filter(isTruthy)}
      />
      <BiteShareDialog bite={bite} isOpen={isOpenShare} close={closeShare} />
      <BiteDeleteDialog
        bite={bite}
        isOpen={isOpenDelete}
        close={closeDelete}
        onDelete={onDelete}
      />
      <BiteDownloadDialog
        bite={bite}
        isOpen={isOpenDownload}
        close={closeDownload}
      />
    </>
  );
};

import {
  IconCheckCircle,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconShare,
  IconTrash,
} from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { ConfirmationDialog } from "@/components/Dialog";
import { StaticTag } from "@/components/Tag";
import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { usePaywallConfig } from "@/features/billing";
import { saveOffline, useOwnedDownload } from "@/features/downloads";
import { openDownloadPaywallModal } from "@/features/global-modals";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isTruthy } from "@/utils/object";
import { useBooleanState } from "@/utils/states";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { isPaidUser } from "@firefliesai/payments-ff.utils";
import type { FC } from "react";
import { Platform } from "react-native";
import { ShareMeetingDialog } from "../share-meeting/ShareMeetingDialog";
import { useMeetingCapabilities } from "../utils/permissions";
import { useMeetingCapabilityGates } from "../access/useMeetingCapabilityGates";
import { MeetingDeleteDialog } from "./MeetingDeleteDialog";
import { MeetingDownloadDialog } from "./MeetingDownloadDialog";
import { MeetingRenameDialog } from "./MeetingRenameDialog";

export const MeetingBottomSheetMenu: FC<{
  meeting: Meeting;
  isOpen: boolean;
  close: () => void;
  onDelete?: () => void;
  showDownload?: boolean;
  fromRef: string;
}> = ({ meeting, isOpen, close, onDelete, showDownload, fromRef }) => {
  const [isOpenShare, openShare, closeShare] = useBooleanState();
  const [isOpenDelete, openDelete, closeDelete] = useBooleanState();
  const [isOpenDownload, openDownload, closeDownload] = useBooleanState();
  const [isOpenRename, openRename, closeRename] = useBooleanState();
  const [isOpenCellularVideo, openCellularVideo, closeCellularVideo] =
    useBooleanState();

  const { canEditMetadata, canDelete } = useMeetingCapabilities(meeting);

  const { downloadDenied, exportDenied, deleteDenied } =
    useMeetingCapabilityGates(meeting.id, {
      download: true,
      export: true,
      delete: true,
    });

  const { hidePaidFeatures } = usePaywallConfig();

  const { user } = useAuth();

  const isSavedOffline = !!useOwnedDownload(meeting.id)?.isManual;

  const onSaveOffline = async () => {
    const outcome = await saveOffline(meeting);
    if (outcome === "needs-cellular-video-confirmation") {
      openCellularVideo();
      return;
    }
    toast({
      message:
        outcome === "saved"
          ? "You can now play this content offline"
          : "Saving offline…",
    });
  };

  return (
    <>
      <BottomSheetMenuModal
        isOpen={isOpen}
        close={close}
        items={[
          {
            Icon: IconShare,
            label: "Share meeting",
            onPress() {
              openShare();
              tracker.track(TRACKING_EVENTS.SHARE_DIALOG_OPENED, {
                type: "meeting",
                from: "bottom-sheet-menu",
                meetingId: meeting.id,
                privacy: meeting.notesPrivacy,
              });
            },
          },
          canEditMetadata && {
            Icon: IconEdit,
            label: "Rename meeting",
            onPress: openRename,
          },
          !hidePaidFeatures &&
            showDownload &&
            !(downloadDenied && exportDenied) && {
              Icon: IconExternalLink,
              label: "Download media or transcript",
              onPress() {
                if (!user?.paidUser || !isPaidUser(user?.paidUser)) {
                  openDownloadPaywallModal(fromRef);
                  return;
                }
                openDownload();
                tracker.track(TRACKING_EVENTS.DOWNLOAD_MODAL_OPENED, {
                  type: "meeting",
                  from: "bottom-sheet-menu",
                  meetingId: meeting.id,
                });
              },
            },
          // iOS/Android only ("web" covers desktop). Only the save action is
          // download-gated; an already-saved copy stays viewable. Not paywalled.
          Platform.OS !== "web" &&
            (isSavedOffline
              ? {
                  Icon: IconCheckCircle,
                  label: "Saved offline",
                  onPress() {
                    toast({
                      message:
                        "This meeting is available offline. Manage saved meetings in Profile → Downloads",
                    });
                  },
                }
              : !downloadDenied && {
                  Icon: IconDownload,
                  label: "Save offline",
                  right: <StaticTag color="cyan">New</StaticTag>,
                  onPress() {
                    void onSaveOffline();
                  },
                }),
          canDelete &&
            !deleteDenied && {
              Icon: IconTrash,
              label: "Delete meeting",
              onPress: openDelete,
            },
        ].filter(isTruthy)}
      />
      <ShareMeetingDialog
        meetingId={meeting.id}
        meeting={meeting}
        isOpen={isOpenShare}
        close={closeShare}
      />
      <MeetingDeleteDialog
        meeting={meeting}
        isOpen={isOpenDelete}
        close={closeDelete}
        onDelete={onDelete}
        fromRef={fromRef}
      />
      <MeetingDownloadDialog
        meeting={meeting}
        isOpen={isOpenDownload}
        close={closeDownload}
      />
      <MeetingRenameDialog
        meeting={meeting}
        isOpen={isOpenRename}
        close={closeRename}
      />
      <ConfirmationDialog
        title="Download video over mobile data?"
        isOpen={isOpenCellularVideo}
        close={closeCellularVideo}
        confirmText="Download video"
        cancelText="Keep audio only"
        onConfirm={() => {
          void saveOffline(meeting, { allowCellularVideo: true });
          toast({ message: "Saving offline…" });
        }}
      >
        This meeting is saved with audio only. Downloading its video now will
        use mobile data.
      </ConfirmationDialog>
    </>
  );
};

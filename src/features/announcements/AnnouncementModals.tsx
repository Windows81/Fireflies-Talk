import type { FC } from "react";
import { useCallback, useState } from "react";
import { ComplianceDialog } from "./ComplianceDialog/ComplianceDialog";
import { OfflineModeAnnouncementModal } from "./OfflineModeModal/OfflineModeAnnouncementModal";
import { TosUpdateAnnouncementModal } from "./tos-update-sept-2026/TosUpdateAnnouncementModal";

export const AnnouncementModals: FC = () => {
  const [currentModal, setCurrentModal] = useState<string | null>(null);

  const open = useCallback((modal: string) => {
    // make sure only one modal is shown at a time
    setCurrentModal((prevCurrentModal) => {
      if (prevCurrentModal) return prevCurrentModal;
      return modal;
    });
  }, []);

  const close = useCallback(() => {
    setCurrentModal(null);
  }, []);

  const openTosUpdate = useCallback(() => {
    open("tosUpdate");
  }, [open]);

  const openComplianceDialog = useCallback(() => {
    open("complianceDialog");
  }, [open]);

  const openOfflineModeAnnouncement = useCallback(() => {
    open("offlineModeAnnouncement");
  }, [open]);

  return (
    <>
      {/* first sibling so its open() claims the slot on launch */}
      <TosUpdateAnnouncementModal
        isOpen={currentModal === "tosUpdate"}
        open={openTosUpdate}
        close={close}
      />
      <ComplianceDialog
        isOpen={currentModal === "complianceDialog"}
        open={openComplianceDialog}
        close={close}
      />
      <OfflineModeAnnouncementModal
        isOpen={currentModal === "offlineModeAnnouncement"}
        open={openOfflineModeAnnouncement}
        close={close}
      />
    </>
  );
};

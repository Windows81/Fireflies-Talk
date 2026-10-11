import {
  ASK_FRED_O_MODAL_NAME,
  AskFredOChatModal,
} from "@/features/ask-fred-o";
import { useEffect, type FC } from "react";
import { FEEDBACK_NUDGE_MODAL_NAME } from "../feedback-nudge/constants";
import { FeedbackNudgeModal } from "../feedback-nudge/FeedbackNudgeModal";
import { RecordActionsContextProvider } from "../live-record/RecordActionsContext";
import { ADD_MODAL_NAME, AddModal } from "./add-modal/AddModal";
import {
  ADD_TO_PLAYLIST_MODAL_NAME,
  AddToPlaylistDialog,
} from "./add-to-playlist-modal/AddToPlaylistDialog";
import {
  CREATE_PLAYLIST_MODAL_NAME,
  CreatePlaylistDialog,
} from "./create-playlist-modal/CreatePlaylistModal";
import {
  DOWNLOAD_PAYWALL_MODAL_NAME,
  DownloadPaywallModal,
} from "./download-paywall-modal/DownloadPaywallModal";
import { useAuth } from "@/features/auth";
import { findMilestone } from "@/hooks/dictationStats";
import {
  forgetMilestoneShare,
  useMilestoneShare,
} from "@/hooks/milestoneShare.store";
import { MilestoneShareModal } from "@/screens/MainDesktop/components/MilestoneShareModal";
import { useGlobalModalsStore } from "./global-modals.store";
import {
  SMART_SEARCH_PAYWALL_MODAL_NAME,
  SmartSearchPaywallModal,
} from "./smart-search-paywall-modal/SmartSearchPaywallModal";
import {
  STORAGE_PAYWALL_MODAL_NAME,
  StoragePaywallModal,
} from "./storage-paywall-modal/StoragePaywallModal";

export const GlobalModals: FC = () => {
  const { modals, modalProps, closeModal } = useGlobalModalsStore();
  const userId = useAuth((s) => s.user?.id);
  const shownUserId = useMilestoneShare((s) => s.shown?.userId);
  const milestone = useMilestoneShare((s) =>
    s.shown?.userId === userId ? s.shown : undefined,
  );
  // The stored rung is a word count from persisted state, so a ladder that has
  // since dropped that rung resolves to nothing.
  const rung = milestone ? findMilestone(milestone.milestoneWords) : undefined;
  // Only another account's or a stale card is dropped. Clearing on every
  // change of user would also close the card this account's own sign-in just
  // opened: the stats card consumes the pending milestone as it opens it, so
  // there would be nothing left to offer again.
  useEffect(() => {
    if (
      (shownUserId && shownUserId !== userId) ||
      (milestone && rung === undefined)
    ) {
      forgetMilestoneShare();
    }
  }, [shownUserId, milestone, rung, userId]);
  const hideMilestone = useMilestoneShare((s) => s.hide);

  const isOpen = (modalName: string) => {
    if (!modals.length) return false;
    return modals[modals.length - 1] === modalName;
  };

  return (
    <>
      {milestone && rung && (
        <MilestoneShareModal
          milestone={rung}
          totalWords={milestone.totalWords}
          isOpen
          close={hideMilestone}
        />
      )}
      <RecordActionsContextProvider>
        <AddModal
          isOpen={isOpen(ADD_MODAL_NAME)}
          close={closeModal}
          {...modalProps[ADD_MODAL_NAME]}
        />
      </RecordActionsContextProvider>
      <StoragePaywallModal
        isOpen={isOpen(STORAGE_PAYWALL_MODAL_NAME)}
        close={closeModal}
        {...modalProps[STORAGE_PAYWALL_MODAL_NAME]}
      />
      <SmartSearchPaywallModal
        isOpen={isOpen(SMART_SEARCH_PAYWALL_MODAL_NAME)}
        close={closeModal}
        {...modalProps[SMART_SEARCH_PAYWALL_MODAL_NAME]}
      />
      <CreatePlaylistDialog
        isOpen={isOpen(CREATE_PLAYLIST_MODAL_NAME)}
        close={closeModal}
        {...modalProps[CREATE_PLAYLIST_MODAL_NAME]}
      />
      <AddToPlaylistDialog
        isOpen={isOpen(ADD_TO_PLAYLIST_MODAL_NAME)}
        close={closeModal}
        {...modalProps[ADD_TO_PLAYLIST_MODAL_NAME]}
      />
      <DownloadPaywallModal
        isOpen={isOpen(DOWNLOAD_PAYWALL_MODAL_NAME)}
        close={closeModal}
      />
      <FeedbackNudgeModal
        isOpen={isOpen(FEEDBACK_NUDGE_MODAL_NAME)}
        close={closeModal}
      />
      <AskFredOChatModal
        isOpen={isOpen(ASK_FRED_O_MODAL_NAME)}
        close={closeModal}
      />
    </>
  );
};

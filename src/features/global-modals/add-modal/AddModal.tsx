import { IconCalendar, IconMic, IconUpload, IconVideo } from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { StaticTag } from "@/components/Tag";
import {
  useBilling,
  usePaywallConfig,
  useShouldShowUnlimitedRecordingCampaign,
} from "@/features/billing";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useBooleanState } from "@/utils/states";
import { useMemo, type FC } from "react";
import { Platform } from "react-native";
import { globalModalsApi } from "../global-modals.store";
import { openStoragePaywallModal } from "../storage-paywall-modal/StoragePaywallModal";
import { ScheduleMeetingModal } from "./components/ScheduleMeetingModal";
import { TranscribeLiveMeetingModal } from "./components/TranscribeLiveMeetingModal";
import { UploadSourceModal } from "./components/UploadSourceModal";
import { pickDocument } from "./components/pickDocument";
import { useTheme } from "@/styles";
import { useRecordActionsContext } from "../../live-record/RecordActionsContext";
import { useRecorder } from "../../live-record/record.store";

export const ADD_MODAL_NAME = "add-modal";

export const AddModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  const theme = useTheme();
  const { startRecording } = useRecordActionsContext();
  const recordingState = useRecorder((state) => state.status.state);
  const [isOpenSchedule, openSchedule, closeSchedule] = useBooleanState();

  const [isOpenTranscribeLive, openTranscribeLive, closeTranscribeLive] =
    useBooleanState();

  const [isOpenUploadSource, openUploadSource, closeUploadSource] =
    useBooleanState();

  const shouldShowUnlimitedTag = useShouldShowUnlimitedRecordingCampaign();

  return (
    <>
      <BottomSheetMenuModal
        isOpen={isOpen}
        close={close}
        title="Capture"
        items={[
          ...(recordingState === "inactive"
            ? [
                {
                  Icon: IconMic,
                  iconBackgroundColor: theme.colors.rainbowStaticPurpleSolid,
                  label: "Record audio",
                  right: shouldShowUnlimitedTag ? (
                    <StaticTag color="purple">Unlimited</StaticTag>
                  ) : null,
                  onPress: () => {
                    startRecording();
                  },
                },
              ]
            : []),
          {
            Icon: IconVideo,
            iconBackgroundColor: theme.colors.rainbowStaticPinkSolid,
            label: "Add to live meeting",
            onPress: () => {
              openTranscribeLive();
              tracker.track(TRACKING_EVENTS.ADD_TO_LIVE_MEETING_MODAL_OPENED, {
                from: "home/add-button",
              });
            },
          },
          {
            Icon: IconUpload,
            iconBackgroundColor: theme.colors.rainbowStaticOrangeSolid,
            label: "Upload Audio or Video",
            onPress: () => {
              if (Platform.OS === "ios") {
                openUploadSource();
              } else {
                pickDocument();
                tracker.track(TRACKING_EVENTS.DOCUMENT_PICKER_OPENED, {
                  from: "home/add-button",
                });
              }
            },
          },
          {
            Icon: IconCalendar,
            iconBackgroundColor: theme.colors.rainbowStaticCyanSolid,
            label: "Schedule meeting",
            onPress: () => {
              openSchedule();
              tracker.track(TRACKING_EVENTS.SCHEDULE_MEETING_MODAL_OPENED, {
                from: "home/add-button",
              });
            },
          },
        ]}
      />
      <ScheduleMeetingModal isOpen={isOpenSchedule} close={closeSchedule} />
      <TranscribeLiveMeetingModal
        isOpen={isOpenTranscribeLive}
        close={closeTranscribeLive}
      />
      <UploadSourceModal
        isOpen={isOpenUploadSource}
        close={closeUploadSource}
      />
    </>
  );
};

export const useOpenAddModal = () => {
  const { hidePaidFeatures } = usePaywallConfig();

  const { reachedTeamMinutesConsumedLimit } = useBilling();

  return useMemo(() => {
    if (reachedTeamMinutesConsumedLimit && hidePaidFeatures) {
      // on iOS, we are not allowed to show any in-app purchase UI
      return undefined;
    }

    return (fromRef: string) => {
      if (reachedTeamMinutesConsumedLimit) {
        openStoragePaywallModal(fromRef);
        return;
      }

      globalModalsApi.openModal(ADD_MODAL_NAME);
      tracker.track(TRACKING_EVENTS.TRANSCRIBE_MENU_OPENED, {
        from: fromRef,
      });
    };
  }, [hidePaidFeatures, reachedTeamMinutesConsumedLimit]);
};

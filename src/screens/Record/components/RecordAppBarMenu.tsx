import { IconGlobe, IconMoreVertical, IconX } from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { IconButton } from "@/components/Button";
import { promptConfirmation } from "@/components/Dialog";
import { SelectPopover } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { getMeetingPrivacyOption } from "@/constants";
import {
  useGetLanguageNameByCode,
  useLanguageOptions,
} from "@/features/language";
import {
  localRecordStoreApi,
  patchRecordingContext,
  recorderApi,
  useRecorder,
  useRecordActionsContext,
  useRecordPreferencesStore,
  type RecordingContext,
} from "@/features/live-record";
import { useMeetingPrivacyOptions } from "@/features/meeting";
import { useTeam } from "@/features/team";
import { Logger } from "@/logger";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { useBooleanState } from "@/utils/states";
import { useMutation } from "@apollo/client";
import {
  UpdateMeetingDocument,
  type MeetingNotesPrivacy,
  type UpdateMeetingMutationVariables,
} from "@firefliesai/mobile-ff.graphql-client";
import { createStyles } from "@/styles";
import { useCallback, useRef, type FC } from "react";
import { Keyboard } from "react-native";

// Lifts toasts above the recording controls and the AskFred bar.
const TOAST_BOTTOM_OFFSET = 130;

const logger = new Logger("RecordAppBarMenu");

/**
 * Three-dot overflow menu on the recording app bar: privacy, language,
 * and discard.
 */
export const RecordAppBarMenu: FC<{ onDiscarded?: () => void }> = ({
  onDiscarded,
}) => {
  const [isMenuOpen, openMenu, closeMenu] = useBooleanState();

  const openMenuOverKeyboard = useCallback(() => {
    Keyboard.dismiss();
    openMenu();
  }, [openMenu]);
  const [isPrivacyOpen, openPrivacy, closePrivacy] = useBooleanState();
  const [isLanguageOpen, openLanguage, closeLanguage] = useBooleanState();

  const context = useRecorder((s) => s.context);
  const setContext = useRecorder((s) => s.setContext);
  const { setStartInputs } = useRecordActionsContext();
  const [updateMeeting] = useMutation(UpdateMeetingDocument);
  const privacyOptions = useMeetingPrivacyOptions();
  const { privacySettingsLocked } = useTeam();
  const languageOptions = useLanguageOptions();
  const getLanguageNameByCode = useGetLanguageNameByCode();
  const storeLanguage = useRecordPreferencesStore((s) => s.language);
  const saveQueue = useRef(Promise.resolve());

  const currentPrivacy = getMeetingPrivacyOption(context?.notesPrivacy);
  const currentLanguage = context?.language || storeLanguage || "en";

  const toastAboveControls = (message: string) =>
    toast({ type: "success", message, bottomOffset: TOAST_BOTTOM_OFFSET });

  // Offline starts have no meeting yet, so the upload creates it from the stored
  // context. Otherwise saves run in order and apply only once the meeting has them.
  const updateRecording = (
    recording: RecordingContext,
    patch: Partial<RecordingContext>,
    meetingFields: Omit<UpdateMeetingMutationVariables, "id">,
    onApplied: () => void,
  ) => {
    const { meetingId } = recording;
    if (!meetingId) {
      const newContext = { ...recording, ...patch };
      setContext(newContext);
      localRecordStoreApi.updateByUri(newContext.fileUri, newContext);
      onApplied();
      return;
    }

    saveQueue.current = saveQueue.current
      .then(() =>
        updateMeeting({ variables: { id: meetingId, ...meetingFields } }),
      )
      .then(() => {
        patchRecordingContext(meetingId, patch);
        onApplied();
      })
      .catch((error) => {
        logger.error("Failed to update the recording meeting", error);
        toast({
          type: "error",
          title: "Failed to update",
          message: "Please try again.",
          bottomOffset: TOAST_BOTTOM_OFFSET,
        });
      });
  };

  const onUpdatePrivacy = (privacy: MeetingNotesPrivacy) => {
    if (!context || privacy === currentPrivacy.value) return;

    updateRecording(
      context,
      { notesPrivacy: privacy },
      { notesPrivacy: privacy },
      () =>
        toastAboveControls(
          `Meeting privacy changed to ${getMeetingPrivacyOption(privacy).label}`,
        ),
    );

    tracker.track(TRACKING_EVENTS.AUDIO_RECORD_PRIVACY_CHANGED, { privacy });
  };

  const onUpdateLanguage = (language: string) => {
    if (language === currentLanguage) return;
    // The next recording keeps the pick even if this meeting's save fails.
    useRecordPreferencesStore.getState().setLanguage(language);
    setStartInputs((prev) => ({ ...prev, language }));
    if (!context) return;

    updateRecording(context, { language }, { customLanguage: language }, () =>
      toastAboveControls(
        `Meeting language changed to ${getLanguageNameByCode(language)}`,
      ),
    );
  };

  const onDiscard = () => {
    promptConfirmation({
      title: "Discard recording?",
      children: "This recording and its notes will be permanently deleted.",
      cancelText: "Keep recording",
      confirmText: "Discard",
      onConfirm: async () => {
        await recorderApi.discard();
        onDiscarded?.();
      },
    });
  };

  return (
    <>
      <IconButton
        label="Recording options"
        Icon={(props) => (
          <IconMoreVertical {...props} width={ICON_SIZE} height={ICON_SIZE} />
        )}
        variant="neutralTransparent"
        onPress={openMenuOverKeyboard}
        style={styles.barButton}
      />
      <BottomSheetMenuModal
        isOpen={isMenuOpen}
        close={closeMenu}
        items={[
          ...(privacySettingsLocked
            ? []
            : [
                {
                  Icon: currentPrivacy.Icon,
                  label: "Privacy",
                  right: (
                    <Text variant="body2Regular" color="textMuted">
                      {currentPrivacy.label}
                    </Text>
                  ),
                  onPress: openPrivacy,
                },
              ]),
          {
            Icon: IconGlobe,
            label: "Language",
            right: (
              <Text variant="body2Regular" color="textMuted">
                {getLanguageNameByCode(currentLanguage)}
              </Text>
            ),
            onPress: openLanguage,
          },
          {
            Icon: IconX,
            label: "Discard recording",
            onPress: onDiscard,
          },
        ]}
      />
      <SelectPopover
        isOpen={isPrivacyOpen}
        close={closePrivacy}
        options={privacyOptions}
        value={currentPrivacy.value}
        onValueChange={(value) => onUpdatePrivacy(value as MeetingNotesPrivacy)}
        aria-label="Change privacy"
        presentation="sheet"
      />
      <SelectPopover
        isOpen={isLanguageOpen}
        close={closeLanguage}
        options={languageOptions}
        value={currentLanguage}
        onValueChange={onUpdateLanguage}
        showSearch
        aria-label="Change recording language"
        presentation="sheet"
      />
    </>
  );
};

const BUTTON_SIZE = 48;
const ICON_SIZE = 28;

const styles = createStyles({
  barButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    margin: 4,
  },
});

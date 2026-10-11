import { Select, TextInput } from "@/components/Input";
import { getMeetingPrivacyOption } from "@/constants";
import {
  useMeetingPrivacyOptions,
  useUpdateMeetingMutation,
} from "@/features/meeting";
import { useTeam } from "@/features/team";
import { createStyles, useTheme, vars } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { isDesktop } from "@/utils/device";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import { useCallback, useEffect, useMemo, useRef, type FC } from "react";
import { Platform, View, type TextInput as RNTextInput } from "react-native";
import { recordEventEmitter } from "../events";
import { localRecordStoreApi } from "../local-record.store";
import { useRecorder } from "../record.store";
import { useRecordActionsContext } from "../RecordActionsContext";

export const RecordStartForm: FC = () => {
  const recordingState = useRecorder((s) => s.status.state);
  const context = useRecorder((s) => s.context);
  const setContext = useRecorder((s) => s.setContext);
  const { setStartInputs, startInputs } = useRecordActionsContext();
  const updateMeeting = useUpdateMeetingMutation();
  const privacyOptions = useMeetingPrivacyOptions();
  const { privacySettingsLocked } = useTeam();
  const theme = useTheme();

  const titleRef = useRef<RNTextInput>(null);

  useEffect(() => {
    const focusAction = () => {
      titleRef.current?.focus();
    };

    recordEventEmitter.on("focusTitle", focusAction);

    return () => {
      recordEventEmitter.off("focusTitle", focusAction);
    };
  }, []);

  const onTitleValueChange = (text: string) => {
    if (recordingState !== "inactive" && context) {
      const newContext = { ...context, title: text };
      setContext(newContext);

      // Offline there is no meeting to rename; the title travels with the
      // context and names the meeting created at upload.
      if (text.length && context.meetingId) {
        updateMeeting({
          id: context.meetingId,
          title: text,
        });
      }
    } else {
      setStartInputs((prev) => ({
        ...prev,
        title: text,
      }));
    }
  };

  const onUpdatePrivacy = useCallback(
    (privacy: MeetingNotesPrivacy) => {
      if (recordingState === "inactive") {
        setStartInputs((prev) => ({
          ...prev,
          notesPrivacy: privacy,
        }));
      } else {
        if (!context) return;

        const newContext = {
          ...context,
          notesPrivacy: privacy,
        };
        setContext(newContext);

        // Offline the meeting does not exist yet, so the choice is kept
        // locally and applied when it is created at upload.
        if (context.meetingId) {
          updateMeeting({
            id: context.meetingId,
            notesPrivacy: privacy,
          });
        }

        localRecordStoreApi.updateByUri(newContext.fileUri, newContext);
      }

      tracker.track(TRACKING_EVENTS.AUDIO_RECORD_PRIVACY_CHANGED, { privacy });
    },
    [recordingState, context, setContext, updateMeeting, setStartInputs],
  );

  const currentPrivacy = useMemo(() => {
    const privacyValue =
      recordingState === "inactive"
        ? startInputs.notesPrivacy
        : context?.notesPrivacy;

    return getMeetingPrivacyOption(privacyValue);
  }, [recordingState, context?.notesPrivacy, startInputs.notesPrivacy]);

  if (recordingState !== "inactive" && Platform.OS !== "web") {
    return null;
  }

  return (
    <View style={styles.root}>
      <TextInput
        ref={titleRef}
        style={styles.input}
        placeholder="Recording Title"
        value={
          recordingState === "inactive" ? startInputs.title : context?.title
        }
        onValueChange={onTitleValueChange}
      />
      <Select
        value={currentPrivacy.value}
        onValueChange={onUpdatePrivacy}
        options={privacyOptions}
        style={styles.privacySelectIcon(theme)}
        disabled={privacySettingsLocked}
        hoverLabel="Meeting Privacy"
        iconOnly
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    gap: 8,
    flexDirection: "row",
    width: "100%",
    marginBottom: 8,
  },
  input: {
    ...vars.elevations[1],
    flex: 1,
    height: 40,
    borderRadius: 8,
  },
  privacySelectIcon: (theme) => ({
    backgroundColor: isDesktop
      ? theme.colors.interactiveSecondaryDefault
      : undefined,
    borderRadius: 8,
    width: 40,
    height: 40,
  }),
});

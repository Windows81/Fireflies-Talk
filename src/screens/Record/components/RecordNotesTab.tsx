import {
  PENDING_RECORDING_NOTES_KEY,
  useManualNotes,
} from "@/features/manual-notes";
import { recordEventEmitter, useRecorder } from "@/features/live-record";
import { getUserRecordingTitle } from "@/features/live-record/utils";
import { useSaveRecordingTitle } from "@/features/live-record/useSaveRecordingTitle";
import { useUpdateMeetingMutation } from "@/features/meeting";
import { ManualNotesEditor } from "@/screens/Live/Notes/ManualNotesEditor";
import { createStyles, FontStyles, useTheme } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { useEffect, useRef, useState, type FC } from "react";
import { Platform, TextInput, View } from "react-native";
import type { RecordViewSource } from "../types";

/**
 * Notes tab of the unified recording/live-meeting screen: an editable meeting
 * title above a full-height manual-notes editor.
 *
 * Both fields save as the user types, and both sources are handled here. For a
 * device recording the title lives in the recorder context (saved through
 * useSaveRecordingTitle) and the notes draft starts under a pending key that
 * LiveRecordController hands off to the real meetingId. For a live meeting the
 * title is an updateMeeting mutation, echoed locally so blur doesn't briefly
 * revert to the stale cached value.
 *
 * onEditingChange reports the two inputs as a single "is the user typing" flag:
 * the parent hides the bottom controls while typing, giving the notes editor
 * the height they were using.
 */
export const RecordNotesTab: FC<{
  source: RecordViewSource;
  onEditingChange?: (isEditing: boolean) => void;
}> = ({ source, onEditingChange }) => {
  const theme = useTheme();
  const liveMeeting =
    source.kind === "live-meeting" ? source.meeting : undefined;

  const recorderMeetingId = useRecorder((s) => s.context?.meetingId);
  const recorderFileUri = useRecorder((s) => s.context?.fileUri);
  const recorderDisplayTitle = useRecorder((s) =>
    getUserRecordingTitle(s.context),
  );
  const { saveTitle: saveRecorderTitle } = useSaveRecordingTitle();
  const updateMeeting = useUpdateMeetingMutation();

  const meetingId = liveMeeting?.id ?? recorderMeetingId;
  const [liveSavedTitle, setLiveSavedTitle] = useState(
    liveMeeting?.title ?? "",
  );
  const displayTitle = liveMeeting ? liveSavedTitle : recorderDisplayTitle;

  const saveTitle = (text: string) => {
    if (!liveMeeting) {
      saveRecorderTitle(text);
      return;
    }
    const newTitle = text.trim();
    if (!newTitle || newTitle === liveSavedTitle) return;
    setLiveSavedTitle(newTitle);
    updateMeeting({ id: liveMeeting.id, title: newTitle });
  };

  const focusedInputs = useRef({ title: false, notes: false });
  const reportEditing = (input: "title" | "notes", isFocused: boolean) => {
    focusedInputs.current[input] = isFocused;
    const { title, notes } = focusedInputs.current;
    onEditingChange?.(title || notes);
  };

  const titleRef = useRef<TextInput>(null);
  const [title, setTitle] = useState(displayTitle);
  const isTitleFocusedRef = useRef(false);
  const titleOnFocusRef = useRef("");

  useEffect(() => {
    if (!isTitleFocusedRef.current) {
      setTitle(displayTitle);
    }
  }, [displayTitle]);

  useEffect(() => {
    const focusAction = () => titleRef.current?.focus();
    recordEventEmitter.on("focusTitle", focusAction);
    return () => recordEventEmitter.off("focusTitle", focusAction);
  }, []);

  // A recording started offline has no meeting yet, so its notes are kept
  // under the file uri until the upload creates one.
  const { notes, setNotes } = useManualNotes(
    meetingId ?? recorderFileUri ?? PENDING_RECORDING_NOTES_KEY,
  );

  return (
    <View style={styles.root}>
      <TextInput
        ref={titleRef}
        style={styles.title(theme)}
        placeholder="New Recording"
        aria-label="Recording title"
        placeholderTextColor={theme.colors.textMuted}
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          saveTitle(text);
        }}
        returnKeyType="done"
        onFocus={() => {
          reportEditing("title", true);
          isTitleFocusedRef.current = true;
          titleOnFocusRef.current = displayTitle;
        }}
        onBlur={() => {
          reportEditing("title", false);
          isTitleFocusedRef.current = false;
          setTitle(displayTitle);
          if (
            source.kind === "recorder" &&
            displayTitle &&
            displayTitle !== titleOnFocusRef.current
          ) {
            tracker.track(TRACKING_EVENTS.AUDIO_RECORD_TITLE_EDITED, {
              titleLength: displayTitle.length,
            });
          }
        }}
      />
      <ManualNotesEditor
        notes={notes}
        setNotes={setNotes}
        placeholder="Write notes here..."
        aria-label="Notes"
        inputStyle={styles.notes}
        onFocus={() => reportEditing("notes", true)}
        onBlur={() => reportEditing("notes", false)}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    padding: 20,
    paddingTop: 8,
    gap: 20,
  },
  title: (theme) => ({
    ...FontStyles.heading4,
    color: theme.colors.textPrimary,
    padding: 0,
    ...(Platform.OS === "web" && { outline: "none" }),
  }),
  notes: {
    fontFamily: FontStyles.heading4.fontFamily,
    lineHeight: 30,
  },
});

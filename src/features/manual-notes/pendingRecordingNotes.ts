import { PENDING_RECORDING_NOTES_KEY, useManualNotesStore } from "./store";

/**
 * Move a notes draft onto the key its recording is now known by, clearing the
 * source either way so a draft can only ever belong to one recording. Notes
 * already typed against the destination win — the draft being moved is older.
 */
export const adoptRecordingNotes = (fromKey: string, toKey: string) => {
  if (fromKey === toKey) return;

  const store = useManualNotesStore.getState();
  const draft = store.byMeetingId[fromKey];
  if (!draft) return;

  if (draft.notes.trim() && !store.byMeetingId[toKey]?.notes.trim()) {
    store.setNotes(toKey, draft.notes);
  }
  store.clearMeeting(fromKey);
};

/**
 * Hand the pre-meeting notes draft over to the recording that just started.
 * Offline that key is the file uri, since no meeting exists yet.
 */
export const claimPendingRecordingNotes = (recordingKey: string) =>
  adoptRecordingNotes(PENDING_RECORDING_NOTES_KEY, recordingKey);

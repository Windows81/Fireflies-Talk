import { useCallback } from "react";
import { useManualNotesStore } from "./store";

interface UseManualNotesResult {
  notes: string;
  shouldMerge: boolean;
  setNotes: (notes: string) => void;
  setShouldMerge: (shouldMerge: boolean) => void;
}

/**
 * Per-meeting manual-notes state, persisted to localStorage / MMKV.
 *
 * All `ManualNotesPanel` instances rendered for the same meeting share the
 * same backing store, so typing in the compact pane is reflected in the
 * full-screen view (and vice versa).
 *
 * Meetings that don't yet have a draft inherit the user's last
 * `shouldMerge` choice (defaults to `true` for first-time users) so the
 * "Merge to summary" preference is sticky across calls.
 */
export const useManualNotes = (meetingId: string): UseManualNotesResult => {
  const entry = useManualNotesStore((state) => state.byMeetingId[meetingId]);
  const defaultShouldMerge = useManualNotesStore(
    (state) => state.defaultShouldMerge,
  );
  const setNotesAction = useManualNotesStore((state) => state.setNotes);
  const setShouldMergeAction = useManualNotesStore(
    (state) => state.setShouldMerge,
  );

  const setNotes = useCallback(
    (notes: string) => setNotesAction(meetingId, notes),
    [meetingId, setNotesAction],
  );
  const setShouldMerge = useCallback(
    (shouldMerge: boolean) => setShouldMergeAction(meetingId, shouldMerge),
    [meetingId, setShouldMergeAction],
  );

  return {
    notes: entry?.notes ?? "",
    shouldMerge: entry?.shouldMerge ?? defaultShouldMerge,
    setNotes,
    setShouldMerge,
  };
};

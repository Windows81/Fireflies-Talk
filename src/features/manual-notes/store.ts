import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage as localStorageOrMemory } from "@/features/storage";

export interface ManualNotesEntry {
  notes: string;
  shouldMerge: boolean;
}

interface ManualNotesState {
  /** Per-meeting drafts kept in storage until uploaded. */
  byMeetingId: Record<string, ManualNotesEntry>;
  /**
   * Last value the user set for the "Merge to summary" checkbox. Used to
   * seed every newly-encountered meeting so the user's preference is
   * sticky across calls. Defaults to `true` for first-time users.
   */
  defaultShouldMerge: boolean;
  setNotes: (meetingId: string, notes: string) => void;
  setShouldMerge: (meetingId: string, shouldMerge: boolean) => void;
  clearMeeting: (meetingId: string) => void;
}

const INITIAL_DEFAULT_SHOULD_MERGE = true;

/**
 * Draft key used while a recording's meeting is not created yet. The draft is
 * migrated to the real meetingId as soon as it exists; autosave never runs
 * for this key.
 */
export const PENDING_RECORDING_NOTES_KEY = "pending-recording";

const upsertEntry = (
  state: ManualNotesState,
  meetingId: string,
  patch: Partial<ManualNotesEntry>,
): ManualNotesState["byMeetingId"] => ({
  ...state.byMeetingId,
  [meetingId]: {
    ...(state.byMeetingId[meetingId] ?? {
      notes: "",
      shouldMerge: state.defaultShouldMerge,
    }),
    ...patch,
  },
});

export const useManualNotesStore = create<ManualNotesState>()(
  persist(
    (set) => ({
      byMeetingId: {},
      defaultShouldMerge: INITIAL_DEFAULT_SHOULD_MERGE,
      setNotes: (meetingId, notes) =>
        set((state) => ({
          byMeetingId: upsertEntry(state, meetingId, { notes }),
        })),
      setShouldMerge: (meetingId, shouldMerge) =>
        set((state) => ({
          byMeetingId: upsertEntry(state, meetingId, { shouldMerge }),
          // Mirror the latest choice into the cross-meeting preference so
          // the next new meeting picks up the same default.
          defaultShouldMerge: shouldMerge,
        })),
      clearMeeting: (meetingId) =>
        set((state) => {
          if (!(meetingId in state.byMeetingId)) return state;
          const next = { ...state.byMeetingId };
          delete next[meetingId];
          return { byMeetingId: next };
        }),
    }),
    {
      name: "manual-notes",
      storage: createJSONStorage(() => localStorageOrMemory),
      partialize: (state) => ({
        byMeetingId: state.byMeetingId,
        defaultShouldMerge: state.defaultShouldMerge,
      }),
    },
  ),
);
